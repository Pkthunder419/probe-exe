using UnityEngine;

public class ProbeCameraFollow : MonoBehaviour
{
    public Transform target;
    public float followSpeed = 5.0f;
    public Vector3 offset = new Vector3(0, 0, -10);

    private void LateUpdate()
    {
        if (target == null)
        {
            return;
        }

        Vector3 desiredPosition = target.position + offset;
        transform.position = Vector3.Lerp(transform.position, desiredPosition, followSpeed * Time.deltaTime);
    }
}
