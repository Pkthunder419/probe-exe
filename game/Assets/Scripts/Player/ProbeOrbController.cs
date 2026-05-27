using UnityEngine;

public class ProbeOrbController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 8.0f;
    public float floatAmplitude = 0.15f;
    public float floatSpeed = 3.0f;

    [Header("Scan Cone")]
    public bool showScanCone = true;

    private Vector3 startScale;
    private float baseY;

    private void Start()
    {
        startScale = transform.localScale;
        baseY = transform.position.y;
    }

    private void Update()
    {
        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");

        Vector3 movement = new Vector3(horizontal, vertical, 0f).normalized;
        transform.position += movement * moveSpeed * Time.deltaTime;

        float floatOffset = Mathf.Sin(Time.time * floatSpeed) * floatAmplitude;
        transform.position = new Vector3(transform.position.x, transform.position.y + floatOffset * Time.deltaTime, transform.position.z);

        float pulse = 1.0f + Mathf.Sin(Time.time * 4.5f) * 0.04f;
        transform.localScale = startScale * pulse;
    }

    private void OnDrawGizmos()
    {
        if (!showScanCone)
        {
            return;
        }

        Gizmos.color = new Color(0.35f, 0.9f, 1.0f, 0.25f);
        Vector3 origin = transform.position;
        Vector3 forward = Vector3.right * 2.0f;
        Vector3 upper = new Vector3(2.8f, 0.7f, 0f);
        Vector3 lower = new Vector3(2.8f, -0.7f, 0f);

        Gizmos.DrawLine(origin, origin + upper);
        Gizmos.DrawLine(origin, origin + lower);
        Gizmos.DrawLine(origin + upper, origin + lower);
        Gizmos.DrawLine(origin, origin + forward);
    }
}
