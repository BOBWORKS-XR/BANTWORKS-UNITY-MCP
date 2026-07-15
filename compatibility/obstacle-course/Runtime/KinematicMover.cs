using UnityEngine;

namespace Bantworks.Compatibility
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Rigidbody))]
    public sealed class KinematicMover : MonoBehaviour
    {
        [SerializeField] private Vector3 worldOffset = new Vector3(3f, 0f, 0f);
        [SerializeField] private float cycleSeconds = 3f;

        private Rigidbody body;
        private Vector3 origin;
        private float elapsed;

        public Vector3 Origin => origin;

        private void Awake()
        {
            body = GetComponent<Rigidbody>();
            origin = body.position;
        }

        private void FixedUpdate()
        {
            elapsed += Time.fixedDeltaTime;
            float phase = cycleSeconds <= 0.01f ? 0f : elapsed * Mathf.PI * 2f / cycleSeconds;
            body.MovePosition(origin + worldOffset * Mathf.Sin(phase));
        }

        public void Configure(Vector3 offset, float period)
        {
            worldOffset = offset;
            cycleSeconds = Mathf.Max(0.1f, period);
        }
    }
}
