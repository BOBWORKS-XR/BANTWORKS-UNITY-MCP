function stripJsoncComments(input) {
  let output = "";
  let inString = false;
  let escape = false;

  for (let index = 0; index < input.length; index++) {
    const current = input[index];
    if (escape) {
      output += current;
      escape = false;
      continue;
    }
    if (current === "\\" && inString) {
      output += current;
      escape = true;
      continue;
    }
    if (current === '"') {
      inString = !inString;
      output += current;
      continue;
    }
    if (!inString && current === "/" && input[index + 1] === "/") {
      output += "  ";
      index += 2;
      while (index < input.length && input[index] !== "\n") {
        output += " ";
        index++;
      }
      if (index < input.length) output += "\n";
      continue;
    }
    if (!inString && current === "/" && input[index + 1] === "*") {
      output += "  ";
      index += 2;
      while (index < input.length) {
        if (input[index] === "*" && input[index + 1] === "/") {
          output += "  ";
          index++;
          break;
        }
        output += input[index] === "\n" ? "\n" : " ";
        index++;
      }
      continue;
    }
    output += current;
  }

  return output;
}

function stripTrailingCommas(input) {
  let output = "";
  let inString = false;
  let escape = false;

  for (let index = 0; index < input.length; index++) {
    const current = input[index];
    if (escape) {
      output += current;
      escape = false;
      continue;
    }
    if (current === "\\" && inString) {
      output += current;
      escape = true;
      continue;
    }
    if (current === '"') {
      inString = !inString;
      output += current;
      continue;
    }
    if (!inString && current === ",") {
      let lookahead = index + 1;
      while (lookahead < input.length && /\s/.test(input[lookahead])) lookahead++;
      if (input[lookahead] === "}" || input[lookahead] === "]") {
        output += " ";
        continue;
      }
    }
    output += current;
  }

  return output;
}

export function parseJsonc(input) {
  tokenize(input);
  const normalized = stripTrailingCommas(stripJsoncComments(input));
  return normalized.trim() ? JSON.parse(normalized) : {};
}

function tokenize(input) {
  const tokens = [];
  let index = 0;

  while (index < input.length) {
    if (/\s/.test(input[index])) {
      index++;
      continue;
    }
    if (input[index] === "/" && input[index + 1] === "/") {
      index += 2;
      while (index < input.length && input[index] !== "\n") index++;
      continue;
    }
    if (input[index] === "/" && input[index + 1] === "*") {
      index += 2;
      let closed = false;
      while (index + 1 < input.length) {
        if (input[index] === "*" && input[index + 1] === "/") {
          index += 2;
          closed = true;
          break;
        }
        index++;
      }
      if (!closed) throw new Error("config contains an unterminated block comment");
      continue;
    }

    const start = index;
    const punctuation = {
      "{": "object-open",
      "}": "object-close",
      "[": "array-open",
      "]": "array-close",
      ":": "colon",
      ",": "comma",
    };
    if (punctuation[input[index]]) {
      tokens.push({ kind: punctuation[input[index]], start, end: ++index });
      continue;
    }
    if (input[index] === '"') {
      index++;
      let escape = false;
      let closed = false;
      while (index < input.length) {
        const current = input[index++];
        if (escape) {
          escape = false;
        } else if (current === "\\") {
          escape = true;
        } else if (current === '"') {
          closed = true;
          break;
        }
      }
      if (!closed) throw new Error("config contains an unterminated string");
      tokens.push({
        kind: "string",
        value: JSON.parse(input.slice(start, index)),
        start,
        end: index,
      });
      continue;
    }

    index++;
    while (
      index < input.length &&
      !/\s/.test(input[index]) &&
      !("{}[]:,".includes(input[index])) &&
      !(input[index] === "/" && (input[index + 1] === "/" || input[index + 1] === "*"))
    ) {
      index++;
    }
    tokens.push({ kind: "scalar", start, end: index });
  }

  return tokens;
}

function valueEnd(tokens, start) {
  if (!tokens[start]) throw new Error("config contains a missing value");
  const initial = tokens[start].kind === "object-open"
    ? "object"
    : tokens[start].kind === "array-open"
      ? "array"
      : null;
  if (!initial) return start + 1;

  const stack = [initial];
  for (let index = start + 1; index < tokens.length; index++) {
    const kind = tokens[index].kind;
    if (kind === "object-open") stack.push("object");
    if (kind === "array-open") stack.push("array");
    if (kind === "object-close" && stack.pop() !== "object") {
      throw new Error("config contains mismatched braces");
    }
    if (kind === "array-close" && stack.pop() !== "array") {
      throw new Error("config contains mismatched brackets");
    }
    if (stack.length === 0) return index + 1;
  }
  throw new Error("config contains an unterminated object or array");
}

function parseObject(tokens, openToken) {
  if (tokens[openToken]?.kind !== "object-open") {
    throw new Error("config value must be an object");
  }
  const closeToken = valueEnd(tokens, openToken) - 1;
  const members = [];
  let index = openToken + 1;

  while (index < closeToken) {
    if (tokens[index].kind === "comma") {
      index++;
      continue;
    }
    if (tokens[index].kind !== "string") {
      throw new Error("config object keys must be quoted strings");
    }
    const key = tokens[index].value;
    const keyToken = index++;
    if (tokens[index]?.kind !== "colon") {
      throw new Error("config key '" + key + "' is missing a colon");
    }
    const valueToken = ++index;
    index = valueEnd(tokens, valueToken);
    members.push({ key, keyToken, valueToken, valueEndToken: index });
    if (index < closeToken && tokens[index].kind === "comma") index++;
  }

  return { closeToken, members };
}

function rootObject(input) {
  const parsed = parseJsonc(input);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("config root must be an object");
  }
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new Error("config root is empty");
  const root = parseObject(tokens, 0);
  if (root.closeToken + 1 !== tokens.length) {
    throw new Error("config contains content after the root object");
  }
  return { tokens, root };
}

function childObject(tokens, object, key) {
  const member = object.members.find((candidate) => candidate.key === key);
  return member ? parseObject(tokens, member.valueToken) : null;
}

function lineIndentAt(input, position) {
  const lineStart = input.lastIndexOf("\n", position - 1) + 1;
  const prefix = input.slice(lineStart, position).replace(/\r$/, "");
  return /^[ \t]*$/.test(prefix) ? prefix : "";
}

function serializeValue(value, indent) {
  const lines = JSON.stringify(value, null, 2).split("\n");
  return lines.map((line, index) => index === 0 ? line : indent + line).join("\n");
}

function removeRanges(input, ranges) {
  let output = input;
  for (const [start, end] of [...ranges].sort((left, right) => right[0] - left[0])) {
    output = output.slice(0, start) + output.slice(end);
  }
  return output;
}

function removeObjectMember(input, objectKey, memberKey) {
  const { tokens, root } = rootObject(input);
  const object = childObject(tokens, root, objectKey);
  if (!object) return input;
  const member = object.members.find((candidate) => candidate.key === memberKey);
  if (!member) return input;

  const memberRange = [
    tokens[member.keyToken].start,
    tokens[member.valueEndToken - 1].end,
  ];
  if (
    member.valueEndToken < object.closeToken &&
    tokens[member.valueEndToken].kind === "comma"
  ) {
    const comma = tokens[member.valueEndToken];
    return removeRanges(input, [memberRange, [comma.start, comma.end]]);
  }
  if (member.keyToken > 0 && tokens[member.keyToken - 1].kind === "comma") {
    const comma = tokens[member.keyToken - 1];
    return removeRanges(input, [memberRange, [comma.start, comma.end]]);
  }
  return removeRanges(input, [memberRange]);
}

function upsertObjectMember(input, objectKey, memberKey, value) {
  const { tokens, root } = rootObject(input);
  const object = objectKey ? childObject(tokens, root, objectKey) : root;
  if (!object) throw new Error("config object '" + objectKey + "' does not exist");

  const member = object.members.find((candidate) => candidate.key === memberKey);
  if (member) {
    const start = tokens[member.valueToken].start;
    const end = tokens[member.valueEndToken - 1].end;
    const indent = lineIndentAt(input, tokens[member.keyToken].start);
    return input.slice(0, start) + serializeValue(value, indent) + input.slice(end);
  }

  const closePosition = tokens[object.closeToken].start;
  const closeIndent = lineIndentAt(input, closePosition);
  const memberIndent = closeIndent + "  ";
  const insertion = "\n" + memberIndent + JSON.stringify(memberKey) + ": " +
    serializeValue(value, memberIndent) + "\n" + closeIndent;
  const lastMember = object.members.at(-1);
  const needsComma = lastMember &&
    !(
      lastMember.valueEndToken < object.closeToken &&
      tokens[lastMember.valueEndToken].kind === "comma"
    );
  const commaPosition = needsComma
    ? tokens[lastMember.valueEndToken - 1].end
    : null;

  if (commaPosition !== null) {
    return input.slice(0, commaPosition) + "," +
      input.slice(commaPosition, closePosition) + insertion + input.slice(closePosition);
  }
  return input.slice(0, closePosition) + insertion + input.slice(closePosition);
}

export function updateJsoncManagedEntry(
  content,
  objectKey,
  managedKey,
  legacyKey,
  entry,
) {
  let output = content.trim() ? content : "{}";
  parseJsonc(output);
  output = removeObjectMember(output, objectKey, legacyKey);

  const { tokens, root } = rootObject(output);
  if (childObject(tokens, root, objectKey)) {
    output = upsertObjectMember(output, objectKey, managedKey, entry);
  } else if (root.members.some((member) => member.key === objectKey)) {
    throw new Error("config '" + objectKey + "' value must be an object");
  } else {
    output = upsertObjectMember(output, null, objectKey, { [managedKey]: entry });
  }

  parseJsonc(output);
  return output.endsWith("\n") ? output : output + "\n";
}
