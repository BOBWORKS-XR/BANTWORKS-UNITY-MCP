using UnityEngine;

namespace Bantworks.Compatibility
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Rigidbody))]
    public sealed class RespawnableBody : MonoBehaviour
    {
        [SerializeField] private Vector3 spawnPosition;
        [SerializeField] private Quaternion spawnRotation = Quaternion.identity;
        [SerializeField] private bool spawnPoseConfigured;

        private Rigidbody body;
        private bool respawnPending;

        public Vector3 SpawnPosition => spawnPosition;
        public Quaternion SpawnRotation => spawnRotation;
        public int RespawnCount { get; private set; }

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            if (!spawnPoseConfigured)
            {
                CaptureCurrentPose();
            }
        }

        private void FixedUpdate()
        {
            if (respawnPending)
            {
                ResetBody();
            }
        }

        public void ConfigureSpawnPose(Vector3 worldPosition, Quaternion worldRotation)
        {
            spawnPosition = worldPosition;
            spawnRotation = worldRotation;
            spawnPoseConfigured = true;
        }

        public void CaptureCurrentPose()
        {
            spawnPosition = transform.position;
            spawnRotation = transform.rotation;
            spawnPoseConfigured = true;
        }

        public void RequestRespawn()
        {
            respawnPending = true;
        }

        private void ResetBody()
        {
            respawnPending = false;
            if (body == null)
            {
                body = GetComponent<Rigidbody>();
            }

            body.position = spawnPosition;
            body.rotation = spawnRotation;
            body.velocity = Vector3.zero;
            body.angularVelocity = Vector3.zero;
            body.Sleep();
            body.WakeUp();
            RespawnCount++;
        }
    }
}
