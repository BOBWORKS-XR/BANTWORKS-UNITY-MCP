using UnityEngine;

namespace Bantworks.Compatibility
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Rigidbody), typeof(HingeJoint))]
    public sealed class DeterministicDoor : MonoBehaviour
    {
        [SerializeField] private int doorIndex;
        [SerializeField] private bool locked;

        public int DoorIndex => doorIndex;
        public bool IsLocked => locked;

        public void Configure(int index, bool shouldLock)
        {
            doorIndex = index;
            locked = shouldLock;

            Rigidbody body = GetComponent<Rigidbody>();
            RigidbodyConstraints baseConstraints = RigidbodyConstraints.FreezePosition |
                RigidbodyConstraints.FreezeRotationX |
                RigidbodyConstraints.FreezeRotationZ;
            body.constraints = locked
                ? baseConstraints | RigidbodyConstraints.FreezeRotationY
                : baseConstraints;

            HingeJoint hinge = GetComponent<HingeJoint>();
            hinge.axis = Vector3.up;
            hinge.anchor = Vector3.zero;
            hinge.useLimits = true;
            JointLimits limits = hinge.limits;
            limits.min = -100f;
            limits.max = 100f;
            hinge.limits = limits;
        }
    }
}
