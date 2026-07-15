using UnityEngine;

namespace Bantworks.Compatibility
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Rigidbody))]
    public sealed class KinematicRotator : MonoBehaviour
    {
        [SerializeField] private Vector3 localAxis = Vector3.up;
        [SerializeField] private float degreesPerSecond = 75f;

        private Rigidbody body;

        public float DegreesPerSecond => degreesPerSecond;

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
        }

        private void FixedUpdate()
        {
            Quaternion delta = Quaternion.AngleAxis(
                degreesPerSecond * Time.fixedDeltaTime,
                localAxis.normalized);
            body.MoveRotation(body.rotation * delta);
        }

        public void Configure(Vector3 axis, float speed)
        {
            localAxis = axis;
            degreesPerSecond = speed;
        }
    }
}
