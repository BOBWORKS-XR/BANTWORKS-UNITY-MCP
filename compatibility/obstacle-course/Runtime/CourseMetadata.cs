using UnityEngine;

namespace Bantworks.Compatibility
{
    [DisallowMultipleComponent]
    public sealed class CourseMetadata : MonoBehaviour
    {
        [SerializeField] private int seed;
        [SerializeField] private int lockedDoorIndex;
        [SerializeField] private int importedDressingCount;
        [SerializeField] private int banterSyncedObjectCount;

        public int Seed => seed;
        public int LockedDoorIndex => lockedDoorIndex;
        public int ImportedDressingCount => importedDressingCount;
        public int BanterSyncedObjectCount => banterSyncedObjectCount;

        public void Configure(int value, int lockedIndex, int dressingCount, int syncedCount)
        {
            seed = value;
            lockedDoorIndex = lockedIndex;
            importedDressingCount = dressingCount;
            banterSyncedObjectCount = syncedCount;
        }
    }
}
