using UnityEngine;

namespace Bantworks.Compatibility
{
    [DisallowMultipleComponent]
    public sealed class RespawnTrigger : MonoBehaviour
    {
        private void OnTriggerEnter(Collider other)
        {
            Rigidbody attachedBody = other.attachedRigidbody;
            RespawnableBody respawnable = attachedBody != null
                ? attachedBody.GetComponent<RespawnableBody>()
                : other.GetComponentInParent<RespawnableBody>();

            if (respawnable != null)
            {
                respawnable.RequestRespawn();
            }
        }
    }
}
