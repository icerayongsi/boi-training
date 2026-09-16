/**
 * Cloudflare Worker for MySQL Training Tunnel Portal
 * Minimal shadcn/ui design (Synced with index.html)
 * Supports:
 *  - GET / : Web portal with instructions and download buttons
 *  - GET /windows-connect-db.ps1 (or /windows, /win, /ps1) : PowerShell script
 *  - GET /unix-connect-db.sh (or /unix, /sh) : Bash script
 *  - GET /health : health check
 */

// Base64 encoded scripts to avoid string escaping and CRLF/LF issues
const B64_UNIX_SCRIPT = `IyEvdXNyL2Jpbi9lbnYgYmFzaAoKc2V0IC1lCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIENsb3VkZmxhcmUgTXlTUUwgVHJhaW5pbmcgLSBVbml4IEluc3RhbGxlcgojIFN1cHBvcnRzOgojICAgLSBMaW51eCB4ODZfNjQKIyAgIC0gTGludXggQVJNNjQKIyAgIC0gbWFjT1MgSW50ZWwKIyAgIC0gbWFjT1MgQXBwbGUgU2lsaWNvbgojICAgLSBXU0wKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KCkNMT1VERkxBUkVfSE9TVE5BTUU9ImJvaS10Zm0tZGIua3R0ZWNoc29sdXRpb24uY29tIgoKSU5TVEFMTF9ESVI9IiRIT01FLy5teXNxbC10cmFpbmluZy9iaW4iCkNMT1VERkxBUkVEPSIkSU5TVEFMTF9ESVIvY2xvdWRmbGFyZWQiCgpERUZBVUxUX1BPUlQ9MzMwNgoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBIZWxwZXJzCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgppbmZvKCkgewogICAgZWNobyAiW0lORk9dICQxIgp9CgpvaygpIHsKICAgIGVjaG8gIltPS10gJDEiCn0KCndhcm4oKSB7CiAgICBlY2hvICJbV0FSTl0gJDEiCn0KCmVycm9yKCkgewogICAgZWNobyAiW0VSUk9SXSAkMSIKfQoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBEZXRlY3QgT1MKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KCk9TPSIkKHVuYW1lIC1zKSIKQVJDSD0iJCh1bmFtZSAtbSkiCgpjYXNlICIkT1MiIGluCiAgICBMaW51eCkKICAgICAgICBPU19OQU1FPSJsaW51eCIKICAgICAgICA7OwogICAgRGFyd2luKQogICAgICAgIE9TX05BTUU9ImRhcndpbiIKICAgICAgICA7OwogICAgKikKICAgICAgICBlcnJvciAiVW5zdXBwb3J0ZWQgT1M6ICRPUyIKICAgICAgICBleGl0IDEKICAgICAgICA7Owplc2FjCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIERldGVjdCBBcmNoaXRlY3R1cmUKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KCmNhc2UgIiRBUkNIIiBpbgogICAgeDg2XzY0fGFtZDY0KQogICAgICAgIEFSQ0hfTkFNRT0iYW1kNjQiCiAgICAgICAgOzsKICAgIGFybTY0fGFhcmNoNjQpCiAgICAgICAgQVJDSF9OQU1FPSJhcm02NCIKICAgICAgICA7OwogICAgYXJtdjdsKQogICAgICAgIEFSQ0hfTkFNRT0iYXJtIgogICAgICAgIDs7CiAgICAqKQogICAgICAgIGVycm9yICJVbnN1cHBvcnRlZCBhcmNoaXRlY3R1cmU6ICRBUkNIIgogICAgICAgIGV4aXQgMQogICAgICAgIDs7CmVzYWMKCmVjaG8KZWNobyAiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSIKZWNobyAiIENsb3VkZmxhcmUgTXlTUUwgVHJhaW5pbmciCmVjaG8gIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iCmVjaG8KZWNobyAiT1MgICAgICAgICAgIDogJE9TX05BTUUiCmVjaG8gIkFyY2hpdGVjdHVyZSA6ICRBUkNIX05BTUUiCmVjaG8gIkhvc3RuYW1lICAgICA6ICRDTE9VREZMQVJFX0hPU1ROQU1FIgplY2hvCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIENoZWNrIGRlcGVuZGVuY2llcwojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQoKaWYgISBjb21tYW5kIC12IGN1cmwgPi9kZXYvbnVsbCAyPiYxOyB0aGVuCiAgICBlcnJvciAiY3VybCBpcyByZXF1aXJlZC4iCiAgICBleGl0IDEKZmkKCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiMgRG93bmxvYWQgVVJMCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgppZiBbICIkT1NfTkFNRSIgPSAiZGFyd2luIiBdOyB0aGVuCgogICAgY2FzZSAiJEFSQ0hfTkFNRSIgaW4KICAgICAgICBhbWQ2NCkKICAgICAgICAgICAgRE9XTkxPQURfVVJMPSJodHRwczovL2dpdGh1Yi5jb20vY2xvdWRmbGFyZS9jbG91ZGZsYXJlZC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvY2xvdWRmbGFyZWQtZGFyd2luLWFtZDY0LnRneiIKICAgICAgICAgICAgOzsKICAgICAgICBhcm02NCkKICAgICAgICAgICAgRE9XTkxPQURfVVJMPSJodHRwczovL2dpdGh1Yi5jb20vY2xvdWRmbGFyZS9jbG91ZGZsYXJlZC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvY2xvdWRmbGFyZWQtZGFyd2luLWFybTY0LnRneiIKICAgICAgICAgICAgOzsKICAgICAgICAqKQogICAgICAgICAgICBlcnJvciAiVW5zdXBwb3J0ZWQgbWFjT1MgYXJjaGl0ZWN0dXJlLiIKICAgICAgICAgICAgZXhpdCAxCiAgICAgICAgICAgIDs7CiAgICBlc2FjCgplbGlmIFsgIiRPU19OQU1FIiA9ICJsaW51eCIgXTsgdGhlbgoKICAgIGNhc2UgIiRBUkNIX05BTUUiIGluCiAgICAgICAgYW1kNjQpCiAgICAgICAgICAgIERPV05MT0FEX1VSTD0iaHR0cHM6Ly9naXRodWIuY29tL2Nsb3VkZmxhcmUvY2xvdWRmbGFyZWQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2Nsb3VkZmxhcmVkLWxpbnV4LWFtZDY0IgogICAgICAgICAgICA7OwogICAgICAgIGFybTY0KQogICAgICAgICAgICBET1dOTE9BRF9VUkw9Imh0dHBzOi8vZ2l0aHViLmNvbS9jbG91ZGZsYXJlL2Nsb3VkZmxhcmVkL3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9jbG91ZGZsYXJlZC1saW51eC1hcm02NCIKICAgICAgICAgICAgOzsKICAgICAgICBhcm0pCiAgICAgICAgICAgIERPV05MT0FEX1VSTD0iaHR0cHM6Ly9naXRodWIuY29tL2Nsb3VkZmxhcmUvY2xvdWRmbGFyZWQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2Nsb3VkZmxhcmVkLWxpbnV4LWFybSIKICAgICAgICAgICAgOzsKICAgICAgICAqKQogICAgICAgICAgICBlcnJvciAiVW5zdXBwb3J0ZWQgTGludXggYXJjaGl0ZWN0dXJlLiIKICAgICAgICAgICAgZXhpdCAxCiAgICAgICAgICAgIDs7CiAgICBlc2FjCgpmaQoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBJbnN0YWxsIGNsb3VkZmxhcmVkCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Cgpta2RpciAtcCAiJElOU1RBTExfRElSIgoKaWYgWyAteCAiJENMT1VERkxBUkVEIiBdOyB0aGVuCgogICAgb2sgImNsb3VkZmxhcmVkIGFscmVhZHkgaW5zdGFsbGVkLiIKCmVsc2UKCiAgICBpbmZvICJEb3dubG9hZGluZyBjbG91ZGZsYXJlZC4uLiIKCiAgICBURU1QX0RJUj0iJChta3RlbXAgLWQpIgoKICAgIHRyYXAgJ3JtIC1yZiAiJFRFTVBfRElSIicgRVhJVAoKICAgIGlmIFsgIiRPU19OQU1FIiA9ICJkYXJ3aW4iIF07IHRoZW4KCiAgICAgICAgY3VybCAtZkwgLS1wcm9ncmVzcy1iYXIgXAogICAgICAgICAgICAiJERPV05MT0FEX1VSTCIgXAogICAgICAgICAgICAtbyAiJFRFTVBfRElSL2Nsb3VkZmxhcmVkLnRneiIKCiAgICAgICAgdGFyIC14emYgIiRURU1QX0RJUi9jbG91ZGZsYXJlZC50Z3oiIFwKICAgICAgICAgICAgLUMgIiRURU1QX0RJUiIKCiAgICAgICAgY3AgIiRURU1QX0RJUi9jbG91ZGZsYXJlZCIgIiRDTE9VREZMQVJFRCIKCiAgICBlbHNlCgogICAgICAgIGN1cmwgLWZMIC0tcHJvZ3Jlc3MtYmFyIFwKICAgICAgICAgICAgIiRET1dOTE9BRF9VUkwiIFwKICAgICAgICAgICAgLW8gIiRDTE9VREZMQVJFRCIKCiAgICBmaQoKICAgIGNobW9kICt4ICIkQ0xPVURGTEFSRUQiCgogICAgb2sgImNsb3VkZmxhcmVkIGluc3RhbGxlZC4iCmZpCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIFZlcmlmeQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQoKZWNobwoKIiRDTE9VREZMQVJFRCIgLS12ZXJzaW9uCgplY2hvCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIFNlbGVjdCBQb3J0CiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgpyZWFkIC1yIC1wICJMb2NhbCBNeVNRTCBwb3J0IFskREVGQVVMVF9QT1JUXTogIiBQT1JUCgpQT1JUPSIke1BPUlQ6LSRERUZBVUxUX1BPUlR9IgoKaWYgISBbWyAiJFBPUlQiID1+IF5bMC05XSskIF1dOyB0aGVuCiAgICBlcnJvciAiSW52YWxpZCBwb3J0LiIKICAgIGV4aXQgMQpmaQoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBDaGVjayBQb3J0CiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgpjaGVja19wb3J0KCkgewoKICAgIGxvY2FsIFBPUlRfVE9fQ0hFQ0s9IiQxIgoKICAgICMgTGludXgKICAgIGlmIGNvbW1hbmQgLXYgc3MgPi9kZXYvbnVsbCAyPiYxOyB0aGVuCiAgICAgICAgaWYgc3MgLWxudCAyPi9kZXYvbnVsbCBcCiAgICAgICAgICAgIHwgYXdrICd7cHJpbnQgJDR9JyBcCiAgICAgICAgICAgIHwgZ3JlcCAtcUUgIjoke1BPUlRfVE9fQ0hFQ0t9JCI7IHRoZW4KICAgICAgICAgICAgcmV0dXJuIDAKICAgICAgICBmaQogICAgZmkKCiAgICAjIG1hY09TCiAgICBpZiBjb21tYW5kIC12IGxzb2YgPi9kZXYvbnVsbCAyPiYxOyB0aGVuCiAgICAgICAgaWYgbHNvZiAtblAgXAogICAgICAgICAgICAtaVRDUDoiJFBPUlRfVE9fQ0hFQ0siIFwKICAgICAgICAgICAgLXNUQ1A6TElTVEVOID4vZGV2L251bGwgMj4mMTsgdGhlbgogICAgICAgICAgICByZXR1cm4gMAogICAgICAgIGZpCiAgICBmaQoKICAgIHJldHVybiAxCn0KCndoaWxlIGNoZWNrX3BvcnQgIiRQT1JUIjsgZG8KCiAgICB3YXJuICJQb3J0ICRQT1JUIGlzIGFscmVhZHkgaW4gdXNlLiIKCiAgICBQT1JUPSQoKFBPUlQgKyAxKSkKCiAgICBpbmZvICJUcnlpbmcgcG9ydCAkUE9SVC4uLiIKCmRvbmUKCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiMgU3RhcnQgQ2xvdWRmbGFyZSBBY2Nlc3MgVENQCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgplY2hvCmVjaG8gIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iCmVjaG8gIiBNeVNRTCBDb25uZWN0aW9uIgplY2hvICI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iCmVjaG8KZWNobyAiUmVtb3RlOiIKZWNobyAiICAkQ0xPVURGTEFSRV9IT1NUTkFNRSIKZWNobyAKZWNobyAiTG9jYWw6IgplY2hvICIgIEhvc3QgOiAxMjcuMC4wLjEiCmVjaG8gIiAgUG9ydCA6ICRQT1JUIgplY2hvCmVjaG8gIlVzZSB0aGlzIGluIE15U1FMIC8gTm9kZS1SRUQ6IgplY2hvCmVjaG8gIiAgSG9zdCA9IDEyNy4wLjAuMSIKZWNobyAiICBQb3J0ID0gJFBPUlQiCmVjaG8KZWNobyAiU3RhcnRpbmcgQ2xvdWRmbGFyZSBBY2Nlc3MuLi4iCmVjaG8KZWNobyAiUHJlc3MgQ3RybCtDIHRvIGRpc2Nvbm5lY3QuIgplY2hvCmVjaG8gIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSIKZWNobyAKCiIkQ0xPVURGTEFSRUQiIGFjY2VzcyB0Y3AgXAogICAgLS1ob3N0bmFtZSAiJENMT1VERkxBUkVfSE9TVE5BTUUiIFwKICAgIC0tdXJsICIxMjcuMC4wLjE6JFBPUlQi`;

const B64_WINDOWS_SCRIPT = `JEVycm9yQWN0aW9uUHJlZmVyZW5jZSA9ICJTdG9wIg0KDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgQ29uZmlnDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KJENsb3VkZmxhcmVIb3N0bmFtZSA9ICJib2ktdGZtLWRiLmt0dGVjaHNvbHV0aW9uLmNvbSINCiRJbnN0YWxsRGlyID0gIiRlbnY6VVNFUlBST0ZJTEVcLm15c3FsLXRyYWluaW5nXGJpbiINCiRDbG91ZGZsYXJlZCA9ICIkSW5zdGFsbERpclxjbG91ZGZsYXJlZC5leGUiDQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KIyBQcmVwYXJlDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KTmV3LUl0ZW0gLUl0ZW1UeXBlIERpcmVjdG9yeSAtRm9yY2UgLVBhdGggJEluc3RhbGxEaXIgfCBPdXQtTnVsbA0KDQpXcml0ZS1Ib3N0ICIiDQpXcml0ZS1Ib3N0ICI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ig0KV3JpdGUtSG9zdCAiIENsb3VkZmxhcmUgTXlTUUwgVHJhaW5pbmciDQpXcml0ZS1Ib3N0ICI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ig0KV3JpdGUtSG9zdCAiIg0KDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgRGV0ZWN0IGFyY2hpdGVjdHVyZQ0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KaWYgKCRlbnY6UFJPQ0VTU09SX0FSQ0hJVEVXNjQzMiAtZXEgIkFSTTY0IiAtb3INCiAgICAkZW52OlBST0NFU1NPUl9BUkNISVRFQ1RVUkUgLWVxICJBUk02NCIpIHsNCg0KICAgICRBcmNoID0gImFybTY0Ig0KDQp9IGVsc2VpZiAoJGVudjpQUk9DRVNTT1JfQVJDSElURUNUVVJFIC1lcSAiQU1ENjQiKSB7DQoNCiAgICAkQXJjaCA9ICJhbWQ2NCINCg0KfSBlbHNlIHsNCg0KICAgIFdyaXRlLUhvc3QgIltFUlJPUl0gVW5zdXBwb3J0ZWQgQ1BVIGFyY2hpdGVjdHVyZS4iDQogICAgZXhpdCAxDQp9DQoNCldyaXRlLUhvc3QgIkFyY2hpdGVjdHVyZSA6ICRBcmNoIg0KV3JpdGUtSG9zdCAiSG9zdG5hbWUgICAgIDogJENsb3VkZmxhcmVIb3N0bmFtZSINCldyaXRlLUhvc3QgIiINCg0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQojIERvd25sb2FkIGNsb3VkZmxhcmVkDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KaWYgKC1ub3QgKFRlc3QtUGF0aCAkQ2xvdWRmbGFyZWQpKSB7DQoNCiAgICBXcml0ZS1Ib3N0ICJbSU5GT10gRG93bmxvYWRpbmcgY2xvdWRmbGFyZWQuLi4iDQoNCiAgICBpZiAoJEFyY2ggLWVxICJhbWQ2NCIpIHsNCiAgICAgICAgJFVybCA9ICJodHRwczovL2dpdGh1Yi5jb20vY2xvdWRmbGFyZS9jbG91ZGZsYXJlZC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvY2xvdWRmbGFyZWQtd2luZG93cy1hbWQ2NC5leGUiDQogICAgfQ0KICAgIGVsc2Ugew0KICAgICAgICAkVXJsID0gImh0dHBzOi8vZ2l0aHViLmNvbS9jbG91ZGZsYXJlZC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvY2xvdWRmbGFyZWQtd2luZG93cy1hcm02NC5leGUiDQogICAgfQ0KDQogICAgSW52b2tlLVdlYlJlcXVlc3QgYA0KICAgICAgICAtVXJpICRVcmwgYA0KICAgICAgICAtT3V0RmlsZSAkQ2xvdWRmbGFyZWQNCg0KICAgIFdyaXRlLUhvc3QgIltPS10gY2xvdWRmbGFyZWQgaW5zdGFsbGVkLiINCn0NCmVsc2Ugew0KDQogICAgV3JpdGUtSG9zdCAiW09LXSByY2xvdWRmbGFyZWQgYWxyZWFkeSBpbnN0YWxsZWQuIg0KfQ0KDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgVmVyc2lvbg0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KJiAkQ2xvdWRmbGFyZWQgLS12ZXJzaW9uDQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KIyBQb3J0DQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KDQokRGVmYXVsdFBvcnQgPSAzMzA2DQoNCiRJbnB1dFBvcnQgPSBSZWFkLUhvc3QgIkxvY2FsIE15U1FMIHBvcnQgWyREZWZhdWx0UG9ydF0iDQoNCmlmIChbc3RyaW5nXTo6SXNOdWxsT3JXaGl0ZVNwYWNlKCRJbnB1dFBvcnQpKSB7DQogICAgJFBvcnQgPSAkRGVmYXVsdFBvcnQNCn0NCmVsc2Ugew0KICAgICRQb3J0ID0gW2ludF0kSW5wdXRQb3J0DQp9DQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KIyBDaGVjayBQb3J0DQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KDQp3aGlsZSAoJHRydWUpIHsNCg0KICAgICRVc2VkID0gR2V0LU5ldFRDUENvbm5lY3Rpb24gYA0KICAgICAgICAtTG9jYWxQb3J0ICRQb3J0IGANCiAgICAgICAgLVN0YXRlIExpc3RlbiBgDQogICAgICAgIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlDQoNCiAgICBpZiAoJG51bGwgLWVxICRVc2VkKSB7DQogICAgICAgIGJyZWFrDQogICAgfQ0KDQogICAgV3JpdGUtSG9zdCAiW1dBUk5dIFBvcnQgJFBvcnQgaXMgYWxyZWFkeSBpbiB1c2UuIg0KDQogICAgJFBvcnQrKw0KDQogICAgV3JpdGUtSG9zdCAiW0lORk9dIFRyeWluZyBwb3J0ICRQb3J0Li4uIg0KfQ0KDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KIyBTdGFydA0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KV3JpdGUtSG9zdCAiIg0KV3JpdGUtSG9zdCAiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSINCldyaXRlLUhvc3QgIiBNeVNRTCBDb25uZWN0aW9uIg0KV3JpdGUtSG9zdCAiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSINCldyaXRlLUhvc3QgIiINCg0KV3JpdGUtSG9zdCAiUmVtb3RlOiINCldyaXRlLUhvc3QgIiAgJENsb3VkZmxhcmVIb3N0bmFtZSINCg0KV3JpdGUtSG9zdCAiIg0KV3JpdGUtSG9zdCAiTG9jYWw6Ig0KV3JpdGUtSG9zdCAiICBIb3N0IDogMTI3LjAuMC4xIg0KV3JpdGUtSG9zdCAiICBQb3J0IDogJFBvcnQiDQoNCldyaXRlLUhvc3QgIiINCldyaXRlLUhvc3QgIk5vZGUtUkVEIC8gTXlTUUw6Ig0KV3JpdGUtSG9zdCAiICBIb3N0ID0gMTI3LjAuMC4xIg0KV3JpdGUtSG9zdCAiICBQb3J0ID0gJFBvcnQiDQoNCldyaXRlLUhvc3QgIiINCldyaXRlLUhvc3QgIlN0YXJ0aW5nIENsb3VkZmxhcmUgQWNjZXNzLi4uIg0KV3JpdGUtSG9zdCAiUHJlc3MgQ3RybCtDIHRvIGRpc2Nvbm5lY3QuIg0KV3JpdGUtSG9zdCAiIg0KDQomICRDbG91ZGZsYXJlZCBhY2Nlc3MgdGNwIGANCiAgICAtLWhvc3RuYW1lICRDbG91ZGZsYXJlSG9zdG5hbWUgYA0KICAgIC0tdXJsICIxMjcuMC4wLjE6JFBvcnQi`;

function decodeBase64(b64) {
  const binaryString = atob(b64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="th" class="dark">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect database</title>
  <meta name="description"
    content="คู่มือและสคริปต์เชื่อมต่อฐานข้อมูล MySQL Training ผ่าน Cloudflare Access TCP สำหรับ Windows, macOS และ Linux">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
    rel="stylesheet">
  <style>
    :root {
      --background: #09090b;
      --foreground: #fafafa;
      --card: #0c0a09;
      --card-foreground: #fafafa;
      --popover: #09090b;
      --popover-foreground: #fafafa;
      --primary: #fafafa;
      --primary-foreground: #18181b;
      --secondary: #27272a;
      --secondary-foreground: #fafafa;
      --muted: #18181b;
      --muted-foreground: #a1a1aa;
      --accent: #27272a;
      --accent-foreground: #fafafa;
      --destructive: #7f1d1d;
      --destructive-foreground: #fef2f2;
      --border: #27272a;
      --input: #27272a;
      --ring: #d4d4d8;
      --radius: 0.5rem;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border-color: var(--border);
    }

    body {
      font-family: 'Geist', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--background);
      color: var(--foreground);
      line-height: 1.5;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 4rem;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }

    /* Header */
    header {
      margin-bottom: 2.5rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background-color: rgba(39, 39, 42, 0.6);
      border: 1px solid var(--border);
      color: #a1a1aa;
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      background-color: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }

    h1 {
      font-size: 1.875rem;
      font-weight: 600;
      letter-spacing: -0.025em;
      color: var(--foreground);
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--muted-foreground);
      font-size: 0.95rem;
    }

    /* Card Component (shadcn) */
    .card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: calc(var(--radius) + 2px);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .card-header {
      margin-bottom: 1.25rem;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--foreground);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .card-description {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-top: 0.25rem;
    }

    /* Tabs Component (shadcn) */
    .tabs-list {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius);
      background-color: var(--muted);
      padding: 3px;
      border: 1px solid var(--border);
      width: 100%;
      margin-bottom: 1.25rem;
    }

    .tab-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      border-radius: calc(var(--radius) - 2px);
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      background: transparent;
      border: none;
      cursor: pointer;
      flex: 1;
      transition: all 0.15s ease-in-out;
      font-family: inherit;
      gap: 0.5rem;
    }

    .tab-trigger:hover {
      color: var(--foreground);
    }

    .tab-trigger.active {
      background-color: #27272a;
      color: var(--foreground);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .tab-panel {
      display: none;
    }

    .tab-panel.active {
      display: block;
    }

    /* Code Snippet Box (shadcn) */
    .code-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--muted-foreground);
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .code-box {
      background-color: #09090b;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .code-box pre {
      margin: 0;
      font-family: 'Geist Mono', monospace;
      font-size: 0.84rem;
      color: #e4e4e7;
      overflow-x: auto;
      white-space: nowrap;
    }

    /* Button Variants (shadcn) */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.5rem 1rem;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.15s ease, border-color 0.15s ease;
      font-family: inherit;
      border: 1px solid transparent;
      gap: 0.5rem;
      height: 2.375rem;
    }

    .btn-primary {
      background-color: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }

    .btn-primary:hover {
      background-color: #e4e4e7;
    }

    .btn-outline {
      background-color: transparent;
      border-color: var(--border);
      color: var(--foreground);
    }

    .btn-outline:hover {
      background-color: var(--accent);
      color: var(--accent-foreground);
    }

    .btn-secondary {
      background-color: var(--secondary);
      color: var(--secondary-foreground);
    }

    .btn-secondary:hover {
      background-color: #3f3f46;
    }

    .btn-sm {
      height: 1.875rem;
      padding: 0 0.65rem;
      font-size: 0.75rem;
      border-radius: calc(var(--radius) - 2px);
    }

    .btn-copy {
      background-color: transparent;
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      height: 1.875rem;
      padding: 0 0.65rem;
      font-size: 0.75rem;
      border-radius: calc(var(--radius) - 2px);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s;
    }

    .btn-copy:hover {
      background-color: var(--accent);
      color: var(--foreground);
    }

    .action-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      margin-top: 1rem;
      margin-bottom: 1.25rem;
    }

    /* Alert Component (shadcn) */
    .alert {
      border: 1px solid var(--border);
      background-color: rgba(24, 24, 27, 0.4);
      border-radius: var(--radius);
      padding: 0.875rem 1rem;
      font-size: 0.8125rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      color: var(--muted-foreground);
      margin-top: 1rem;
    }

    .alert svg {
      flex-shrink: 0;
      color: #a1a1aa;
      margin-top: 1px;
    }

    .alert code {
      font-family: 'Geist Mono', monospace;
      background: #18181b;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      color: #fafafa;
      font-size: 0.78rem;
    }

    /* Step Guide */
    .step-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .step-row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .step-badge {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: calc(var(--radius) - 2px);
      background-color: var(--muted);
      border: 1px solid var(--border);
      color: var(--foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-heading {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 0.2rem;
    }

    .step-text {
      font-size: 0.8125rem;
      color: var(--muted-foreground);
    }

    /* Table / Grid for Credentials */
    .creds-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .creds-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
    }

    .creds-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .creds-key {
      color: var(--muted-foreground);
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .creds-value {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-family: 'Geist Mono', monospace;
      font-size: 0.875rem;
      color: var(--foreground);
    }

    /* Toast Notification (shadcn sonner style) */
    .toast {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      background-color: #18181b;
      border: 1px solid var(--border);
      color: var(--foreground);
      padding: 0.65rem 1rem;
      border-radius: var(--radius);
      font-size: 0.8125rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 50;
      pointer-events: none;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      color: #71717a;
      font-size: 0.8125rem;
    }

    @media (max-width: 640px) {
      .container {
        padding: 2rem 1rem;
      }

      .creds-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
      }
    }
  </style>
</head>

<body>

  <div class="container">
    <header>
      <h1>เชื่อมต่อ Database</h1>
      <p class="subtitle">
        ระบบเชื่อมต่อฐานข้อมูลผ่าน Cloudflare Access TCP
      </p>
    </header>

    <!-- Platform Selector & Download Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          ดาวน์โหลดสคริปต์เชื่อมต่อ
        </div>
        <div class="card-description">เลือกระบบปฏิบัติการของคุณเพื่อรันคำสั่งหรือดาวน์โหลดสคริปต์</div>
      </div>

      <div class="tabs-list" role="tablist">
        <button class="tab-trigger active" id="tab-btn-win" onclick="switchTab('win')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
          </svg>
          Windows (PowerShell)
        </button>
        <button class="tab-trigger" id="tab-btn-unix" onclick="switchTab('unix')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 17l6-6-6-6" />
            <path d="M12 19h8" />
          </svg>
          macOS / Linux / WSL
        </button>
      </div>

      <!-- Windows Tab Content -->
      <div id="tab-win" class="tab-panel active">
        <div class="code-label">
          <span>วิธีที่ 1: รันคำสั่ง One-liner ผ่าน PowerShell (แนะนำ)</span>
        </div>
        <div class="code-box">
          <pre><code id="code-win">irm <span class="host-url">...</span>/windows | iex</code></pre>
          <button class="btn-copy" onclick="copySnippet('code-win')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy
          </button>
        </div>

        <div class="code-label">
          <span>วิธีที่ 2: ดาวน์โหลดไฟล์สคริปต์ไปรันเอง</span>
        </div>
        <div class="action-group">
          <a id="link-dl-win" href="/windows-connect-db.ps1" download="windows-connect-db.ps1" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            ดาวน์โหลด windows-connect-db.ps1
          </a>
          <button class="btn btn-outline"
            onclick="copyCustom('powershell -ExecutionPolicy Bypass -File .\\\\windows-connect-db.ps1')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy คำสั่งรันไฟล์
          </button>
        </div>

        <div class="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            หากติดสิทธิ์ ExecutionPolicy บน Windows ให้เปิด PowerShell แล้วรัน
            <code>Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code> ก่อนรันสคริปต์
          </div>
        </div>
      </div>

      <!-- Unix Tab Content -->
      <div id="tab-unix" class="tab-panel">
        <div class="code-label">
          <span>วิธีที่ 1: รันคำสั่ง One-liner ผ่าน Terminal (แนะนำ)</span>
        </div>
        <div class="code-box">
          <pre><code id="code-unix">curl -sSL <span class="host-url">...</span>/unix | bash</code></pre>
          <button class="btn-copy" onclick="copySnippet('code-unix')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy
          </button>
        </div>

        <div class="code-label">
          <span>วิธีที่ 2: ดาวน์โหลดไฟล์สคริปต์ไปรันเอง</span>
        </div>
        <div class="action-group">
          <a id="link-dl-unix" href="/unix-connect-db.sh" download="unix-connect-db.sh" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            ดาวน์โหลด unix-connect-db.sh
          </a>
          <button class="btn btn-outline" onclick="copyCustom('chmod +x unix-connect-db.sh && ./unix-connect-db.sh')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy คำสั่ง chmod & run
          </button>
        </div>

        <div class="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            รองรับ Linux (amd64 / arm64 / armv7l), macOS (Apple Silicon M-series & Intel) และ WSL บน Windows
            สคริปต์จะตรวจจับและติดตั้ง cloudflared ให้อัตโนมัติ
          </div>
        </div>
      </div>
    </div>

  </div>

  <div id="toast" class="toast">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <span id="toast-msg">คัดลอกลงคลิปบอร์ดแล้ว</span>
  </div>

  <script>
    function switchTab(tab) {
      document.querySelectorAll('.tab-trigger').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(c => c.classList.remove('active'));

      if (tab === 'win') {
        document.getElementById('tab-btn-win').classList.add('active');
        document.getElementById('tab-win').classList.add('active');
      } else {
        document.getElementById('tab-btn-unix').classList.add('active');
        document.getElementById('tab-unix').classList.add('active');
      }
    }

    function setupDynamicUrls() {
      const origin = window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')
        ? window.location.origin
        : 'https://<your-worker-domain>';

      document.querySelectorAll('.host-url').forEach(el => {
        el.textContent = origin;
      });

      if (origin.startsWith('http')) {
        const winLink = document.getElementById('link-dl-win');
        const unixLink = document.getElementById('link-dl-unix');
        if (winLink) winLink.href = origin + '/windows-connect-db.ps1';
        if (unixLink) unixLink.href = origin + '/unix-connect-db.sh';
      }
    }

    function showToast(text) {
      const toast = document.getElementById('toast');
      const msg = document.getElementById('toast-msg');
      msg.textContent = text || 'คัดลอกลงคลิปบอร์ดแล้ว';
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }

    function copySnippet(elementId) {
      const el = document.getElementById(elementId);
      if (el) copyCustom(el.innerText);
    }

    function copyCustom(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('คัดลอกแล้ว');
        }).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('คัดลอกสำเร็จ');
      } catch (err) { }
      document.body.removeChild(textArea);
    }

    let showPass = false;
    function togglePassword() {
      showPass = !showPass;
      const pwdEl = document.getElementById('pwd-text');
      const btnEl = document.getElementById('pwd-toggle-btn');
      if (showPass) {
        pwdEl.textContent = '12345687';
        btnEl.textContent = 'Hide';
      } else {
        pwdEl.textContent = '••••••••';
        btnEl.textContent = 'Show';
      }
    }

    window.addEventListener('DOMContentLoaded', setupDynamicUrls);
  </script>
</body>

</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // 1. Health check
    if (path === '/health' || path === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'mysql-tunnel-portal' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. Windows PowerShell script routes
    if (
      path === '/windows-connect-db.ps1' ||
      path === '/windows' ||
      path === '/win' ||
      path === '/ps1'
    ) {
      const content = decodeBase64(B64_WINDOWS_SCRIPT);
      const isDownload = path.endsWith('.ps1') || url.searchParams.get('download') === '1';

      const headers = {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      };

      if (isDownload) {
        headers['Content-Disposition'] = 'attachment; filename="windows-connect-db.ps1"';
      }

      return new Response(content, { headers });
    }

    // 3. Unix Bash script routes
    if (
      path === '/unix-connect-db.sh' ||
      path === '/unix' ||
      path === '/sh'
    ) {
      const content = decodeBase64(B64_UNIX_SCRIPT);
      const isDownload = path.endsWith('.sh') || url.searchParams.get('download') === '1';

      const headers = {
        'Content-Type': isDownload ? 'text/x-shellscript; charset=utf-8' : 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      };

      if (isDownload) {
        headers['Content-Disposition'] = 'attachment; filename="unix-connect-db.sh"';
      }

      return new Response(content, { headers });
    }

    // 4. Portal Landing page
    if (path === '/' || path === '/index.html') {
      const renderedHtml = HTML_CONTENT.replace(
        /https:\/\/<your-worker-domain>/g,
        url.origin
      );

      return new Response(renderedHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 404 Fallback - redirect to home
    return Response.redirect(url.origin + '/', 302);
  }
};
