using System.Collections;
using System.Linq;
using System.Text.RegularExpressions;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace Bantworks.Compatibility.Tests
{
    public sealed class CompatibilityCoursePlayModeTests
    {
        [UnityTest]
        public IEnumerator Respawn_restores_world_pose_rotation_and_zero_motion()
        {
            yield return LoadCourse();
            RespawnableBody respawnable = FindRespawnable("Ball_Left");
            Rigidbody body = respawnable.GetComponent<Rigidbody>();
            bool originalGravity = body.useGravity;
            body.useGravity = false;

            GameObject offsetParent = new GameObject("RuntimeParentOffset");
            respawnable.transform.SetParent(offsetParent.transform, true);
            offsetParent.transform.SetPositionAndRotation(
                new Vector3(13f, 4f, -7f),
                Quaternion.Euler(12f, 31f, 8f));

            body.position = respawnable.SpawnPosition + new Vector3(8f, 5f, -4f);
            body.rotation = Quaternion.Euler(47f, 122f, 19f);
            body.velocity = new Vector3(6f, -3f, 2f);
            body.angularVelocity = new Vector3(4f, 5f, 6f);
            respawnable.RequestRespawn();

            yield return new WaitForFixedUpdate();

            Assert.That(Vector3.Distance(body.position, respawnable.SpawnPosition), Is.LessThan(0.02f));
            Assert.That(Quaternion.Angle(body.rotation, respawnable.SpawnRotation), Is.LessThan(0.2f));
            Assert.That(body.velocity.sqrMagnitude, Is.LessThan(0.0001f));
            Assert.That(body.angularVelocity.sqrMagnitude, Is.LessThan(0.0001f));
            Assert.That(respawnable.RespawnCount, Is.EqualTo(1));
            body.useGravity = originalGravity;
        }

        [UnityTest]
        public IEnumerator Global_trigger_requests_a_body_respawn()
        {
            yield return LoadCourse();
            RespawnableBody respawnable = FindRespawnable("Ball_Right");
            Rigidbody body = respawnable.GetComponent<Rigidbody>();
            body.useGravity = false;
            body.position = new Vector3(0f, -7f, 70f);
            body.velocity = new Vector3(3f, -8f, 1f);
            Physics.SyncTransforms();

            for (int index = 0; index < 4 && respawnable.RespawnCount == 0; index++)
            {
                yield return new WaitForFixedUpdate();
            }

            Assert.That(respawnable.RespawnCount, Is.GreaterThan(0));
            Assert.That(Vector3.Distance(body.position, respawnable.SpawnPosition), Is.LessThan(0.1f));
            Assert.That(body.velocity.sqrMagnitude, Is.LessThan(0.0001f));
            Assert.That(body.angularVelocity.sqrMagnitude, Is.LessThan(0.0001f));
        }

        [UnityTest]
        public IEnumerator Kinematic_obstacles_move_through_fixed_update()
        {
            yield return LoadCourse();
            KinematicMover mover = Object.FindObjectOfType<KinematicMover>();
            KinematicRotator rotator = Object.FindObjectOfType<KinematicRotator>();
            Assert.That(mover, Is.Not.Null);
            Assert.That(rotator, Is.Not.Null);

            Vector3 initialPosition = mover.transform.position;
            Quaternion initialRotation = rotator.transform.rotation;
            yield return new WaitForSeconds(0.55f);

            Assert.That(Vector3.Distance(mover.transform.position, initialPosition), Is.GreaterThan(0.05f));
            Assert.That(Quaternion.Angle(rotator.transform.rotation, initialRotation), Is.GreaterThan(1f));
        }

        [UnityTest]
        public IEnumerator Door_seed_and_optional_integrations_are_consistent()
        {
            yield return LoadCourse();
            DeterministicDoor[] doors = Object.FindObjectsOfType<DeterministicDoor>()
                .OrderBy(door => door.DoorIndex)
                .ToArray();
            CourseMetadata metadata = Object.FindObjectOfType<CourseMetadata>();

            Assert.That(metadata, Is.Not.Null);
            Assert.That(doors.Length, Is.EqualTo(3));
            Assert.That(doors.Count(door => door.IsLocked), Is.EqualTo(1));
            Assert.That(doors.Single(door => door.IsLocked).DoorIndex, Is.EqualTo(metadata.LockedDoorIndex));
            Assert.That(metadata.ImportedDressingCount, Is.GreaterThanOrEqualTo(0));

            System.Type syncedType = System.AppDomain.CurrentDomain.GetAssemblies()
                .Select(assembly => assembly.GetType("Banter.SDK.BanterSyncedObject", false))
                .FirstOrDefault(type => type != null);
            if (syncedType == null)
            {
                Assert.That(metadata.BanterSyncedObjectCount, Is.EqualTo(0));
            }
            else
            {
                Assert.That(metadata.BanterSyncedObjectCount, Is.EqualTo(2));
            }
        }

        private static IEnumerator LoadCourse()
        {
            Time.timeScale = 1f;
            ExpectUnhostedBanterUserCleanupOnSceneLoad();
            SceneManager.LoadScene("CompatibilityCourse", LoadSceneMode.Single);
            yield return null;
            Assert.That(SceneManager.GetActiveScene().name, Is.EqualTo("CompatibilityCourse"));
        }

        private static void ExpectUnhostedBanterUserCleanupOnSceneLoad()
        {
            System.Type userDataType = FindType("UserData");
            System.Type sceneType = FindType("Banter.SDK.BanterScene");
            if (userDataType == null || sceneType == null)
            {
                return;
            }

            System.Reflection.MethodInfo instanceMethod = sceneType.GetMethod(
                "Instance",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
            System.Reflection.FieldInfo linkField = sceneType.GetField(
                "link",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            object scene = instanceMethod == null ? null : instanceMethod.Invoke(null, null);
            object link = scene == null || linkField == null ? null : linkField.GetValue(scene);
            if (scene == null || link != null)
            {
                return;
            }

            foreach (Object user in Object.FindObjectsOfType(userDataType))
            {
                LogAssert.Expect(
                    LogType.Exception,
                    new Regex("^NullReferenceException: Object reference not set to an instance of an object"));
            }
        }

        private static RespawnableBody FindRespawnable(string objectName)
        {
            GameObject target = GameObject.Find(objectName);
            Assert.That(target, Is.Not.Null, "Missing course object: " + objectName);
            RespawnableBody respawnable = target.GetComponent<RespawnableBody>();
            Assert.That(respawnable, Is.Not.Null, "Missing RespawnableBody on " + objectName);
            return respawnable;
        }

        private static System.Type FindType(string fullName)
        {
            return System.AppDomain.CurrentDomain.GetAssemblies()
                .Select(assembly => assembly.GetType(fullName, false))
                .FirstOrDefault(type => type != null);
        }
    }
}
