# Troubleshoot API configuration: 401, 403, 404, 429, and connection failures

[Project overview](../../README.md) · [中文](../TROUBLESHOOTING.md) · [Quick start](QUICKSTART.md) · [Security](../../SECURITY.md)

Record the client, version, operating system, time, and redacted status code. Never post a real key, authorization header, import URI, full configuration, or sensitive request body.

## Which error should you check first?

| Symptom                              | Likely area to inspect                                      | Next step                                                                         |
| ------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 401 Unauthorized                     | Missing, expired, malformed, or wrong-provider key          | Verify the credential in the matching provider's console                          |
| 403 Forbidden                        | Model permissions, account restrictions, or access policy   | Check provider logs; do not assume every 403 means insufficient balance           |
| 404 Not Found                        | Wrong Base URL, duplicated path, or unsupported protocol    | Compare the client and provider docs; some providers also hide resources with 404 |
| 429 Too Many Requests                | Rate limit, concurrency, quota, or capacity                 | Follow the provider response and retry guidance; do not loop rapidly              |
| Timeout, DNS, or TLS failure         | Domain, connection, proxy, or certificate                   | Diagnose the connection; do not disable TLS verification to hide the error        |
| Models listed, request fails         | Model ID, permission, or protocol compatibility             | Test the actual model through the target client                                   |
| Old API remains active               | CC Switch activation, old terminal, or environment override | Activate the provider, restart, and verify effective settings                     |
| CC Switch does not open              | Missing app or unregistered import protocol                 | Run the environment check or use manual setup                                     |
| Codex settings are wrong after apply | Template replaced a needed customization                    | Review and restore the backup; do not delete the whole configuration directory    |

## Does quick setup check installation?

No. **Configure API now** skips installation and environment checks. If `codex`, `claude`, or CC Switch is missing, choose **Check environment first**. A successful gateway request does not prove that the client is installed.

## Can you trust an earlier successful connection check after editing settings?

No. The result applies only to the endpoint, key, and model used for that request. The assistant clears the previous result when any of these fields changes and ignores late responses from an outdated test. Test the new configuration again.

## What should an issue report contain?

- Operating system and assistant version.
- Client and quick/full setup mode.
- Minimal steps, expected behavior, and actual behavior.
- Redacted error codes, not a full credential-bearing configuration.

Use the [issue template](https://github.com/easyrouter/seedrouter-api-setup/issues/new/choose). If a key was exposed, revoke or rotate it with the provider before waiting for a response.
