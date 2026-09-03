use serde_json::Value;

#[derive(Debug, Clone)]
enum TokenKind {
    ObjectOpen,
    ObjectClose,
    ArrayOpen,
    ArrayClose,
    Colon,
    Comma,
    String(String),
    Scalar,
}

#[derive(Debug, Clone)]
struct Token {
    kind: TokenKind,
    start: usize,
    end: usize,
}

#[derive(Debug)]
struct Member {
    key: String,
    key_token: usize,
    value_token: usize,
    value_end_token: usize,
}

#[derive(Debug)]
struct Object {
    close_token: usize,
    members: Vec<Member>,
}

pub fn parse(content: &str) -> Result<Value, String> {
    tokenize(content)?;
    let normalized = strip_trailing_commas(&strip_comments(content));
    if normalized.trim().is_empty() {
        return Ok(serde_json::json!({}));
    }
    serde_json::from_str(&normalized).map_err(|error| error.to_string())
}

pub fn update_managed_entry(
    content: &str,
    object_key: &str,
    managed_key: &str,
    legacy_key: &str,
    entry: &Value,
) -> Result<String, String> {
    let mut output = if content.trim().is_empty() {
        "{}".to_string()
    } else {
        content.to_string()
    };
    parse(&output)?;
    output = remove_object_member(&output, object_key, legacy_key)?;

    let (tokens, root) = root_object(&output)?;
    if child_object(&tokens, &root, object_key)?.is_some() {
        output = upsert_object_member(&output, Some(object_key), managed_key, entry)?;
    } else if root.members.iter().any(|member| member.key == object_key) {
        return Err(format!("config '{}' value must be an object", object_key));
    } else {
        let mut managed = serde_json::Map::new();
        managed.insert(managed_key.to_string(), entry.clone());
        output = upsert_object_member(&output, None, object_key, &Value::Object(managed))?;
    }

    parse(&output)?;
    if !output.ends_with('\n') {
        output.push('\n');
    }
    Ok(output)
}

pub fn remove_managed_entries(
    content: &str,
    object_key: &str,
    managed_key: &str,
    legacy_key: &str,
) -> Result<String, String> {
    if content.trim().is_empty() {
        return Ok(content.to_string());
    }
    parse(content)?;
    let output = remove_object_member(content, object_key, managed_key)?;
    let mut output = remove_object_member(&output, object_key, legacy_key)?;
    parse(&output)?;
    if !output.ends_with('\n') {
        output.push('\n');
    }
    Ok(output)
}

fn strip_comments(input: &str) -> String {
    let mut output = String::with_capacity(input.len());
    let mut in_string = false;
    let mut escape = false;
    let mut chars = input.chars().peekable();

    while let Some(current) = chars.next() {
        if escape {
            output.push(current);
            escape = false;
            continue;
        }
        if current == '\\' && in_string {
            output.push(current);
            escape = true;
            continue;
        }
        if current == '"' {
            in_string = !in_string;
            output.push(current);
            continue;
        }
        if !in_string && current == '/' {
            match chars.peek().copied() {
                Some('/') => {
                    chars.next();
                    output.push(' ');
                    output.push(' ');
                    for character in chars.by_ref() {
                        if character == '\n' {
                            output.push('\n');
                            break;
                        }
                        output.push(' ');
                    }
                    continue;
                }
                Some('*') => {
                    chars.next();
                    output.push(' ');
                    output.push(' ');
                    while let Some(character) = chars.next() {
                        if character == '*' && chars.peek().copied() == Some('/') {
                            chars.next();
                            output.push(' ');
                            output.push(' ');
                            break;
                        }
                        output.push(if character == '\n' { '\n' } else { ' ' });
                    }
                    continue;
                }
                _ => {}
            }
        }
        output.push(current);
    }

    output
}

fn strip_trailing_commas(input: &str) -> String {
    let chars: Vec<char> = input.chars().collect();
    let mut output = String::with_capacity(input.len());
    let mut in_string = false;
    let mut escape = false;
    let mut index = 0;

    while index < chars.len() {
        let current = chars[index];
        if escape {
            output.push(current);
            escape = false;
            index += 1;
            continue;
        }
        if current == '\\' && in_string {
            output.push(current);
            escape = true;
            index += 1;
            continue;
        }
        if current == '"' {
            in_string = !in_string;
            output.push(current);
            index += 1;
            continue;
        }
        if !in_string && current == ',' {
            let mut lookahead = index + 1;
            while lookahead < chars.len() && chars[lookahead].is_whitespace() {
                lookahead += 1;
            }
            if lookahead < chars.len() && matches!(chars[lookahead], '}' | ']') {
                output.push(' ');
                index += 1;
                continue;
            }
        }
        output.push(current);
        index += 1;
    }

    output
}

fn tokenize(input: &str) -> Result<Vec<Token>, String> {
    let bytes = input.as_bytes();
    let mut tokens = Vec::new();
    let mut index = 0;

    while index < bytes.len() {
        if bytes[index].is_ascii_whitespace() {
            index += 1;
            continue;
        }
        if bytes[index] == b'/' && index + 1 < bytes.len() {
            if bytes[index + 1] == b'/' {
                index += 2;
                while index < bytes.len() && bytes[index] != b'\n' {
                    index += 1;
                }
                continue;
            }
            if bytes[index + 1] == b'*' {
                index += 2;
                let mut closed = false;
                while index + 1 < bytes.len() {
                    if bytes[index] == b'*' && bytes[index + 1] == b'/' {
                        index += 2;
                        closed = true;
                        break;
                    }
                    index += 1;
                }
                if !closed {
                    return Err("config contains an unterminated block comment".to_string());
                }
                continue;
            }
        }

        let start = index;
        let kind = match bytes[index] {
            b'{' => {
                index += 1;
                TokenKind::ObjectOpen
            }
            b'}' => {
                index += 1;
                TokenKind::ObjectClose
            }
            b'[' => {
                index += 1;
                TokenKind::ArrayOpen
            }
            b']' => {
                index += 1;
                TokenKind::ArrayClose
            }
            b':' => {
                index += 1;
                TokenKind::Colon
            }
            b',' => {
                index += 1;
                TokenKind::Comma
            }
            b'"' => {
                index += 1;
                let mut escape = false;
                let mut closed = false;
                while index < bytes.len() {
                    let current = bytes[index];
                    index += 1;
                    if escape {
                        escape = false;
                    } else if current == b'\\' {
                        escape = true;
                    } else if current == b'"' {
                        closed = true;
                        break;
                    }
                }
                if !closed {
                    return Err("config contains an unterminated string".to_string());
                }
                let decoded: String = serde_json::from_str(&input[start..index])
                    .map_err(|error| format!("invalid JSON string: {}", error))?;
                TokenKind::String(decoded)
            }
            _ => {
                index += 1;
                while index < bytes.len() {
                    let current = bytes[index];
                    let starts_comment = current == b'/'
                        && index + 1 < bytes.len()
                        && matches!(bytes[index + 1], b'/' | b'*');
                    if current.is_ascii_whitespace()
                        || matches!(current, b'{' | b'}' | b'[' | b']' | b':' | b',')
                        || starts_comment
                    {
                        break;
                    }
                    index += 1;
                }
                TokenKind::Scalar
            }
        };
        tokens.push(Token {
            kind,
            start,
            end: index,
        });
    }

    Ok(tokens)
}

fn value_end(tokens: &[Token], start: usize) -> Result<usize, String> {
    if start >= tokens.len() {
        return Err("config contains a missing value".to_string());
    }
    let initial = match tokens[start].kind {
        TokenKind::ObjectOpen => Some(false),
        TokenKind::ArrayOpen => Some(true),
        _ => None,
    };
    let Some(initial) = initial else {
        return Ok(start + 1);
    };

    let mut stack = vec![initial];
    let mut index = start + 1;
    while index < tokens.len() {
        match tokens[index].kind {
            TokenKind::ObjectOpen => stack.push(false),
            TokenKind::ArrayOpen => stack.push(true),
            TokenKind::ObjectClose => {
                if stack.pop() != Some(false) {
                    return Err("config contains mismatched braces".to_string());
                }
            }
            TokenKind::ArrayClose => {
                if stack.pop() != Some(true) {
                    return Err("config contains mismatched brackets".to_string());
                }
            }
            _ => {}
        }
        index += 1;
        if stack.is_empty() {
            return Ok(index);
        }
    }
    Err("config contains an unterminated object or array".to_string())
}

fn parse_object(tokens: &[Token], open_token: usize) -> Result<Object, String> {
    if !matches!(
        tokens.get(open_token).map(|token| &token.kind),
        Some(TokenKind::ObjectOpen)
    ) {
        return Err("config value must be an object".to_string());
    }
    let close_after = value_end(tokens, open_token)?;
    let close_token = close_after - 1;
    let mut members = Vec::new();
    let mut index = open_token + 1;

    while index < close_token {
        if matches!(tokens[index].kind, TokenKind::Comma) {
            index += 1;
            continue;
        }
        let key = match &tokens[index].kind {
            TokenKind::String(value) => value.clone(),
            _ => return Err("config object keys must be quoted strings".to_string()),
        };
        let key_token = index;
        index += 1;
        if !matches!(
            tokens.get(index).map(|token| &token.kind),
            Some(TokenKind::Colon)
        ) {
            return Err(format!("config key '{}' is missing a colon", key));
        }
        index += 1;
        let value_token = index;
        index = value_end(tokens, value_token)?;
        members.push(Member {
            key,
            key_token,
            value_token,
            value_end_token: index,
        });
        if index < close_token && matches!(tokens[index].kind, TokenKind::Comma) {
            index += 1;
        }
    }

    Ok(Object {
        close_token,
        members,
    })
}

fn root_object(input: &str) -> Result<(Vec<Token>, Object), String> {
    let parsed = parse(input)?;
    if !parsed.is_object() {
        return Err("config root must be an object".to_string());
    }
    let tokens = tokenize(input)?;
    if tokens.is_empty() {
        return Err("config root is empty".to_string());
    }
    let root = parse_object(&tokens, 0)?;
    if root.close_token + 1 != tokens.len() {
        return Err("config contains content after the root object".to_string());
    }
    Ok((tokens, root))
}

fn child_object(tokens: &[Token], object: &Object, key: &str) -> Result<Option<Object>, String> {
    let Some(member) = object.members.iter().find(|member| member.key == key) else {
        return Ok(None);
    };
    parse_object(tokens, member.value_token).map(Some)
}

fn line_indent_at(input: &str, position: usize) -> String {
    let line_start = input[..position]
        .rfind('\n')
        .map(|offset| offset + 1)
        .unwrap_or(0);
    let prefix = &input[line_start..position];
    if prefix
        .chars()
        .all(|character| matches!(character, ' ' | '\t' | '\r'))
    {
        prefix.trim_end_matches('\r').to_string()
    } else {
        String::new()
    }
}

fn serialize_value(value: &Value, indent: &str) -> Result<String, String> {
    let serialized = serde_json::to_string_pretty(value)
        .map_err(|error| format!("failed to serialize managed entry: {}", error))?;
    let mut lines = serialized.lines();
    let mut output = lines.next().unwrap_or_default().to_string();
    for line in lines {
        output.push('\n');
        output.push_str(indent);
        output.push_str(line);
    }
    Ok(output)
}

fn remove_ranges(input: &str, ranges: &[(usize, usize)]) -> String {
    let mut output = input.to_string();
    let mut ordered = ranges.to_vec();
    ordered.sort_by(|left, right| right.0.cmp(&left.0));
    for (start, end) in ordered {
        output.replace_range(start..end, "");
    }
    output
}

fn remove_object_member(input: &str, object_key: &str, member_key: &str) -> Result<String, String> {
    let (tokens, root) = root_object(input)?;
    let Some(object) = child_object(&tokens, &root, object_key)? else {
        return Ok(input.to_string());
    };
    let Some(member) = object
        .members
        .iter()
        .find(|member| member.key == member_key)
    else {
        return Ok(input.to_string());
    };

    let member_range = (
        tokens[member.key_token].start,
        tokens[member.value_end_token - 1].end,
    );
    if member.value_end_token < object.close_token
        && matches!(tokens[member.value_end_token].kind, TokenKind::Comma)
    {
        let comma = &tokens[member.value_end_token];
        return Ok(remove_ranges(
            input,
            &[member_range, (comma.start, comma.end)],
        ));
    }
    if member.key_token > 0 && matches!(tokens[member.key_token - 1].kind, TokenKind::Comma) {
        let comma = &tokens[member.key_token - 1];
        return Ok(remove_ranges(
            input,
            &[member_range, (comma.start, comma.end)],
        ));
    }

    Ok(remove_ranges(input, &[member_range]))
}

fn upsert_object_member(
    input: &str,
    object_key: Option<&str>,
    member_key: &str,
    value: &Value,
) -> Result<String, String> {
    let (tokens, root) = root_object(input)?;
    let object = if let Some(key) = object_key {
        child_object(&tokens, &root, key)?
            .ok_or_else(|| format!("config object '{}' does not exist", key))?
    } else {
        root
    };

    if let Some(member) = object
        .members
        .iter()
        .find(|member| member.key == member_key)
    {
        let value_start = tokens[member.value_token].start;
        let value_end = tokens[member.value_end_token - 1].end;
        let indent = line_indent_at(input, tokens[member.key_token].start);
        let serialized = serialize_value(value, &indent)?;
        let mut output = String::with_capacity(input.len() + serialized.len());
        output.push_str(&input[..value_start]);
        output.push_str(&serialized);
        output.push_str(&input[value_end..]);
        return Ok(output);
    }

    let close_position = tokens[object.close_token].start;
    let close_indent = line_indent_at(input, close_position);
    let member_indent = format!("{}  ", close_indent);
    let serialized = serialize_value(value, &member_indent)?;
    let key = serde_json::to_string(member_key)
        .map_err(|error| format!("failed to serialize managed key: {}", error))?;
    let insertion = format!(
        "\n{}{}: {}\n{}",
        member_indent, key, serialized, close_indent
    );

    let comma_position = object.members.last().and_then(|member| {
        if member.value_end_token < object.close_token
            && matches!(tokens[member.value_end_token].kind, TokenKind::Comma)
        {
            None
        } else {
            Some(tokens[member.value_end_token - 1].end)
        }
    });

    let mut output = String::with_capacity(input.len() + insertion.len() + 1);
    if let Some(comma_position) = comma_position {
        output.push_str(&input[..comma_position]);
        output.push(',');
        output.push_str(&input[comma_position..close_position]);
    } else {
        output.push_str(&input[..close_position]);
    }
    output.push_str(&insertion);
    output.push_str(&input[close_position..]);
    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry() -> Value {
        serde_json::json!({
            "type": "local",
            "command": ["node", "C:/Creator Works/server.mjs"],
            "enabled": true,
            "environment": {
                "UNITY_PROJECT_PATH": "C:/Unity/Project",
                "CREATOR_WORKS_TOOL_GROUPS": "read,author"
            }
        })
    }

    #[test]
    fn update_preserves_unrelated_jsonc_and_accepts_trailing_commas() {
        let input = r#"{
  // Keep this user comment.
  "theme": "https://example.com/a//b",
  "quote": "say \"hello\"",
  "mcp": {
    /* Keep this server. */
    "other": {
      "type": "remote",
    },
    // Remove only the legacy managed entry.
    "banter": {
      "enabled": false,
    },
  },
}"#;

        let output =
            update_managed_entry(input, "mcp", "creator-works", "banter", &entry()).unwrap();
        let parsed = parse(&output).unwrap();

        assert!(output.contains("// Keep this user comment."));
        assert!(output.contains("/* Keep this server. */"));
        assert!(output.contains("\"theme\": \"https://example.com/a//b\""));
        assert!(output.contains("\"quote\": \"say \\\"hello\\\"\""));
        assert!(parsed["mcp"]["other"].is_object());
        assert_eq!(parsed["mcp"]["creator-works"]["enabled"], true);
        assert!(parsed["mcp"].get("banter").is_none());
    }

    #[test]
    fn update_replaces_only_existing_managed_value() {
        let input = r#"{
  "mcp": {
    // Keep this comment.
    "creator-works": { "enabled": false },
    "other": { "enabled": true }
  }
}"#;

        let output =
            update_managed_entry(input, "mcp", "creator-works", "banter", &entry()).unwrap();
        let parsed = parse(&output).unwrap();

        assert!(output.contains("// Keep this comment."));
        assert_eq!(parsed["mcp"]["creator-works"]["enabled"], true);
        assert_eq!(parsed["mcp"]["other"]["enabled"], true);
    }

    #[test]
    fn remove_preserves_unrelated_members_and_comments() {
        let input = r#"{
  "mcp": {
    // User-owned server.
    "other": { "enabled": true },
    "creator-works": { "enabled": true },
  },
  /* User setting. */
  "theme": "dark",
}"#;

        let output = remove_managed_entries(input, "mcp", "creator-works", "banter").unwrap();
        let parsed = parse(&output).unwrap();

        assert!(output.contains("// User-owned server."));
        assert!(output.contains("/* User setting. */"));
        assert_eq!(parsed["mcp"]["other"]["enabled"], true);
        assert!(parsed["mcp"].get("creator-works").is_none());
    }

    #[test]
    fn update_rejects_non_object_mcp_without_rewriting() {
        let error = update_managed_entry(
            r#"{ "mcp": false }"#,
            "mcp",
            "creator-works",
            "banter",
            &entry(),
        )
        .unwrap_err();
        assert!(error.contains("must be an object"));
    }
}
