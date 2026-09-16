/**
 * Cloudflare Worker for MySQL Training Tunnel Portal
 * Supports:
 *  - GET / : Web portal with instructions and download buttons
 *  - GET /windows-connect-db.ps1 (or /windows, /win, /ps1) : PowerShell script
 *  - GET /unix-connect-db.sh (or /unix, /sh) : Bash script
 *  - GET /health : health check
 */

// Base64 encoded scripts to avoid string escaping and CRLF/LF issues
const B64_UNIX_SCRIPT = `IyEvdXNyL2Jpbi9lbnYgYmFzaAoKc2V0IC1lCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIENsb3VkZmxhcmUgTXlTUUwgVHJhaW5pbmcgLSBVbml4IEluc3RhbGxlcgojIFN1cHBvcnRzOgojICAgLSBMaW51eCB4ODZfNjQKIyAgIC0gTGludXggQVJNNjQKIyAgIC0gbWFjT1MgSW50ZWwKIyAgIC0gbWFjT1MgQXBwbGUgU2lsaWNvbgojICAgLSBXU0wKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KCkNMT1VERkxBUkVfSE9TVE5BTUU9ImJvaS10Zm0tZGIua3R0ZWNoc29sdXRpb24uY29tIgoKSU5TVEFMTF9ESVI9IiRIT01FLy5teXNxbC10cmFpbmluZy9iaW4iCkNMT1VERkxBUkVEPSIkSU5TVEFMTF9ESVIvY2xvdWRmbGFyZWQiCgpERUZBVUxUX1BPUlQ9MzMwNgoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBIZWxwZXJzCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgppbmZvKCkgewogICAgZWNobyAiW0lORk9dICQxIgp9CgpvaygpIHsKICAgIGVjaG8gIltPS10gJDEiCn0KCndhcm4oKSB7CiAgICBlY2hvICJbV0FSTl0gJDEiCn0KCmVycm9yKCkgewogICAgZWNobyAiW0VSUk9SXSAkMSIKfQoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBEZXRlY3QgT1MKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KCk9TPSIkKHVuYW1lIC1zKSIKQVJDSD0iJCh1bmFtZSAtbSkiCgpjYXNlICIkT1MiIGluCiAgICBMaW51eCkKICAgICAgICBPU19OQU1FPSJsaW51eCIKICAgICAgICA7OwogICAgRGFyd2luKQogICAgICAgIE9TX05BTUU9ImRhcndpbiIKICAgICAgICA7OwogICAgKikKICAgICAgICBlcnJvciAiVW5zdXBwb3J0ZWQgT1M6ICRPUyIKICAgICAgICBleGl0IDEKICAgICAgICA7Owplc2FjCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIERldGVjdCBBcmNoaXRlY3R1cmUKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KCmNhc2UgIiRBUkNIIiBpbgogICAgeDg2XzY0fGFtZDY0KQogICAgICAgIEFSQ0hfTkFNRT0iYW1kNjQiCiAgICAgICAgOzsKICAgIGFybTY0fGFhcmNoNjQpCiAgICAgICAgQVJDSF9OQU1FPSJhcm02NCIKICAgICAgICA7OwogICAgYXJtdjdsKQogICAgICAgIEFSQ0hfTkFNRT0iYXJtIgogICAgICAgIDs7CiAgICAqKQogICAgICAgIGVycm9yICJVbnN1cHBvcnRlZCBhcmNoaXRlY3R1cmU6ICRBUkNIIgogICAgICAgIGV4aXQgMQogICAgICAgIDs7CmVzYWMKCmVjaG8KZWNobyAiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSIKZWNobyAiIENsb3VkZmxhcmUgTXlTUUwgVHJhaW5pbmciCmVjaG8gIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iCmVjaG8KZWNobyAiT1MgICAgICAgICAgIDogJE9TX05BTUUiCmVjaG8gIkFyY2hpdGVjdHVyZSA6ICRBUkNIX05BTUUiCmVjaG8gIkhvc3RuYW1lICAgICA6ICRDTE9VREZMQVJFX0hPU1ROQU1FIgplY2hvCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIENoZWNrIGRlcGVuZGVuY2llcwojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQoKaWYgISBjb21tYW5kIC12IGN1cmwgPi9kZXYvbnVsbCAyPiYxOyB0aGVuCiAgICBlcnJvciAiY3VybCBpcyByZXF1aXJlZC4iCiAgICBleGl0IDEKZmkKCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiMgRG93bmxvYWQgVVJMCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgppZiBbICIkT1NfTkFNRSIgPSAiZGFyd2luIiBdOyB0aGVuCgogICAgY2FzZSAiJEFSQ0hfTkFNRSIgaW4KICAgICAgICBhbWQ2NCkKICAgICAgICAgICAgRE9XTkxPQURfVVJMPSJodHRwczovL2dpdGh1Yi5jb20vY2xvdWRmbGFyZS9jbG91ZGZsYXJlZC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvY2xvdWRmbGFyZWQtZGFyd2luLWFtZDY0LnRneiIKICAgICAgICAgICAgOzsKICAgICAgICBhcm02NCkKICAgICAgICAgICAgRE9XTkxPQURfVVJMPSJodHRwczovL2dpdGh1Yi5jb20vY2xvdWRmbGFyZS9jbG91ZGZsYXJlZC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvY2xvdWRmbGFyZWQtZGFyd2luLWFybTY0LnRneiIKICAgICAgICAgICAgOzsKICAgICAgICAqKQogICAgICAgICAgICBlcnJvciAiVW5zdXBwb3J0ZWQgbWFjT1MgYXJjaGl0ZWN0dXJlLiIKICAgICAgICAgICAgZXhpdCAxCiAgICAgICAgICAgIDs7CiAgICBlc2FjCgplbGlmIFsgIiRPU19OQU1FIiA9ICJsaW51eCIgXTsgdGhlbgoKICAgIGNhc2UgIiRBUkNIX05BTUUiIGluCiAgICAgICAgYW1kNjQpCiAgICAgICAgICAgIERPV05MT0FEX1VSTD0iaHR0cHM6Ly9naXRodWIuY29tL2Nsb3VkZmxhcmUvY2xvdWRmbGFyZWQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2Nsb3VkZmxhcmVkLWxpbnV4LWFtZDY0IgogICAgICAgICAgICA7OwogICAgICAgIGFybTY0KQogICAgICAgICAgICBET1dOTE9BRF9VUkw9Imh0dHBzOi8vZ2l0aHViLmNvbS9jbG91ZGZsYXJlL2Nsb3VkZmxhcmVkL3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9jbG91ZGZsYXJlZC1saW51eC1hcm02NCIKICAgICAgICAgICAgOzsKICAgICAgICBhcm0pCiAgICAgICAgICAgIERPV05MT0FEX1VSTD0iaHR0cHM6Ly9naXRodWIuY29tL2Nsb3VkZmxhcmUvY2xvdWRmbGFyZWQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2Nsb3VkZmxhcmVkLWxpbnV4LWFybSIKICAgICAgICAgICAgOzsKICAgICAgICAqKQogICAgICAgICAgICBlcnJvciAiVW5zdXBwb3J0ZWQgTGludXggYXJjaGl0ZWN0dXJlLiIKICAgICAgICAgICAgZXhpdCAxCiAgICAgICAgICAgIDs7CiAgICBlc2FjCgpmaQoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBJbnN0YWxsIGNsb3VkZmxhcmVkCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Cgpta2RpciAtcCAiJElOU1RBTExfRElSIgoKaWYgWyAteCAiJENMT1VERkxBUkVEIiBdOyB0aGVuCgogICAgb2sgImNsb3VkZmxhcmVkIGFscmVhZHkgaW5zdGFsbGVkLiIKCmVsc2UKCiAgICBpbmZvICJEb3dubG9hZGluZyBjbG91ZGZsYXJlZC4uLiIKCiAgICBURU1QX0RJUj0iJChta3RlbXAgLWQpIgoKICAgIHRyYXAgJ3JtIC1yZiAiJFRFTVBfRElSIicgRVhJVAoKICAgIGlmIFsgIiRPU19OQU1FIiA9ICJkYXJ3aW4iIF07IHRoZW4KCiAgICAgICAgY3VybCAtZkwgLS1wcm9ncmVzcy1iYXIgXAogICAgICAgICAgICAiJERPV05MT0FEX1VSTCIgXAogICAgICAgICAgICAtbyAiJFRFTVBfRElSL2Nsb3VkZmxhcmVkLnRneiIKCiAgICAgICAgdGFyIC14emYgIiRURU1QX0RJUi9jbG91ZGZsYXJlZC50Z3oiIFwKICAgICAgICAgICAgLUMgIiRURU1QX0RJUiIKCiAgICAgICAgY3AgIiRURU1QX0RJUi9jbG91ZGZsYXJlZCIgIiRDTE9VREZMQVJFRCIKCiAgICBlbHNlCgogICAgICAgIGN1cmwgLWZMIC0tcHJvZ3Jlc3MtYmFyIFwKICAgICAgICAgICAgIiRET1dOTE9BRF9VUkwiIFwKICAgICAgICAgICAgLW8gIiRDTE9VREZMQVJFRCIKCiAgICBmaQoKICAgIGNobW9kICt4ICIkQ0xPVURGTEFSRUQiCgogICAgb2sgImNsb3VkZmxhcmVkIGluc3RhbGxlZC4iCmZpCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIFZlcmlmeQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQoKZWNobwoKIiRDTE9VREZMQVJFRCIgLS12ZXJzaW9uCgplY2hvCgojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQojIFNlbGVjdCBQb3J0CiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgpyZWFkIC1yIC1wICJMb2NhbCBNeVNRTCBwb3J0IFskREVGQVVMVF9QT1JUXTogIiBQT1JUCgpQT1JUPSIke1BPUlQ6LSRERUZBVUxUX1BPUlR9IgoKaWYgISBbWyAiJFBPUlQiID1+IF5bMC05XSskIF1dOyB0aGVuCiAgICBlcnJvciAiSW52YWxpZCBwb3J0LiIKICAgIGV4aXQgMQpmaQoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyBDaGVjayBQb3J0CiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgpjaGVja19wb3J0KCkgewoKICAgIGxvY2FsIFBPUlRfVE9fQ0hFQ0s9IiQxIgoKICAgICMgTGludXgKICAgIGlmIGNvbW1hbmQgLXYgc3MgPi9kZXYvbnVsbCAyPiYxOyB0aGVuCiAgICAgICAgaWYgc3MgLWxudCAyPi9kZXYvbnVsbCBcCiAgICAgICAgICAgIHwgYXdrICd7cHJpbnQgJDR9JyBcCiAgICAgICAgICAgIHwgZ3JlcCAtcUUgIjoke1BPUlRfVE9fQ0hFQ0t9JCI7IHRoZW4KICAgICAgICAgICAgcmV0dXJuIDAKICAgICAgICBmaQogICAgZmkKCiAgICAjIG1hY09TCiAgICBpZiBjb21tYW5kIC12IGxzb2YgPi9kZXYvbnVsbCAyPiYxOyB0aGVuCiAgICAgICAgaWYgbHNvZiAtblAgXAogICAgICAgICAgICAtaVRDUDoiJFBPUlRfVE9fQ0hFQ0siIFwKICAgICAgICAgICAgLXNUQ1A6TElTVEVOID4vZGV2L251bGwgMj4mMTsgdGhlbgogICAgICAgICAgICByZXR1cm4gMAogICAgICAgIGZpCiAgICBmaQoKICAgIHJldHVybiAxCn0KCndoaWxlIGNoZWNrX3BvcnQgIiRQT1JUIjsgZG8KCiAgICB3YXJuICJQb3J0ICRQT1JUIGlzIGFscmVhZHkgaW4gdXNlLiIKCiAgICBQT1JUPSQoKFBPUlQgKyAxKSkKCiAgICBpbmZvICJUcnlpbmcgcG9ydCAkUE9SVC4uLiIKCmRvbmUKCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiMgU3RhcnQgQ2xvdWRmbGFyZSBBY2Nlc3MgVENQCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CgplY2hvCmVjaG8gIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iCmVjaG8gIiBNeVNRTCBDb25uZWN0aW9uIgplY2hvICI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iCmVjaG8KZWNobyAiUmVtb3RlOiIKZWNobyAiICAkQ0xPVURGTEFSRV9IT1NUTkFNRSIKZWNobyAKZWNobyAiTG9jYWw6IgplY2hvICIgIEhvc3QgOiAxMjcuMC4wLjEiCmVjaG8gIiAgUG9ydCA6ICRQT1JUIgplY2hvCmVjaG8gIlVzZSB0aGlzIGluIE15U1FMIC8gTm9kZS1SRUQ6IgplY2hvCmVjaG8gIiAgSG9zdCA9IDEyNy4wLjAuMSIKZWNobyAiICBQb3J0ID0gJFBPUlQiCmVjaG8KZWNobyAiU3RhcnRpbmcgQ2xvdWRmbGFyZSBBY2Nlc3MuLi4iCmVjaG8KZWNobyAiUHJlc3MgQ3RybCtDIHRvIGRpc2Nvbm5lY3QuIgplY2hvCmVjaG8gIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSIKZWNobyAKCiIkQ0xPVURGTEFSRUQiIGFjY2VzcyB0Y3AgXAogICAgLS1ob3N0bmFtZSAiJENMT1VERkxBUkVfSE9TVE5BTUUiIFwKICAgIC0tdXJsICIxMjcuMC4wLjE6JFBPUlQi`;

const B64_WINDOWS_SCRIPT = `JEVycm9yQWN0aW9uUHJlZmVyZW5jZSA9ICJTdG9wIg0KDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgQ29uZmlnDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KJENsb3VkZmxhcmVIb3N0bmFtZSA9ICJib2ktdGZtLWRiLmt0dGVjaHNvbHV0aW9uLmNvbSINCiRJbnN0YWxsRGlyID0gIiRlbnY6VVNFUlBST0ZJTEVcLm15c3FsLXRyYWluaW5nXGJpbiINCiRDbG91ZGZsYXJlZCA9ICIkSW5zdGFsbERpclxjbG91ZGZsYXJlZC5leGUiDQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgUHJlcGFyZQ0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQoNCk5ldy1JdGVtIC1JdGVtVHlwZSBEaXJlY3RvcnkgLUZvcmNlIC1QYXRoICRJbnN0YWxsRGlyIHwgT3V0LU51bGwNCg0KV3JpdGUtSG9zdCAiIg0KV3JpdGUtSG9zdCAiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iDQpXcml0ZS1Ib3N0ICIgQ2xvdWRmbGFyZSBNeVNRTCBUcmFpbmluZyINCldyaXRlLUhvc3QgIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iDQpXcml0ZS1Ib3N0ICIiDQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgRGV0ZWN0IGFyY2hpdGVjdHVyZQ0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQoNCmlmICgkZW52OlBST0NFU1NPUl9BUkNISVRFVzY0MzIgLWVxICJBUk02NCIgLW9yDQogICAgJGVudjpQUk9DRVNTT1JfQVJDSElURUNUVVJFIC1lcSAiQVJNNjQiKSB7DQoNCiAgICAkQXJjaCA9ICJhcm02NCINCg0KfSBlbHNlaWYgKCRlbnY6UFJPQ0VTU09SX0FSQ0hJVEVDVFVSRSAtZXEgIkFNRDY0Iikgew0KDQogICAgJEFyY2ggPSAiYW1kNjQiDQoNCn0gZWxzZSB7DQoNCiAgICBXcml0ZS1Ib3N0ICJbRVJST1JdIFVuc3VwcG9ydGVkIENQVSBhcmNoaXRlY3R1cmUuIg0KICAgIGV4aXQgMQ0KfQ0KDQpXcml0ZS1Ib3N0ICJBcmNoaXRlY3R1cmUgOiAkQXJjaCINCldyaXRlLUhvc3QgIkhvc3RuYW1lICAgICA6ICRDbG91ZGZsYXJlSG9zdG5hbWUiDQpXcml0ZS1Ib3N0ICIiDQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgRG93bmxvYWQgY2xvdWRmbGFyZWQNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KaWYgKC1ub3QgKFRlc3QtUGF0aCAkQ2xvdWRmbGFyZWQpKSB7DQoNCiAgICBXcml0ZS1Ib3N0ICJbSU5GT10gRG93bmxvYWRpbmcgY2xvdWRmbGFyZWQuLi4iDQoNCiAgICBpZiAoJEFyY2ggLWVxICJhbWQ2NCIpIHsNCiAgICAgICAgJFVybCA9ICJodHRwczovL2dpdGh1Yi5jb20vY2xvdWRmbGFyZS9jbG91ZGZsYXJlZC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvY2xvdWRmbGFyZWQtd2luZG93cy1hbWQ2NC5leGUiDQogICAgfQ0KICAgIGVsc2Ugew0KICAgICAgICAkVXJsID0gImh0dHBzOi8vZ2l0aHViLmNvbS9jbG91ZGZsYXJlL2Nsb3VkZmxhcmVkL3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9jbG91ZGZsYXJlZC13aW5kb3dzLWFybTY0LmV4ZSINCiAgICB9DQoNCiAgICBJbnZva2UtV2ViUmVxdWVzdCBgDQogICAgICAgIC1VcmkgJFVybCBgDQogICAgICAgIC1PdXRGaWxlICRDbG91ZGZsYXJlZA0KDQogICAgV3JpdGUtSG9zdCAiW09LXXIgY2xvdWRmbGFyZWQgaW5zdGFsbGVkLiINCn0NCmVsc2Ugew0KDQogICAgV3JpdGUtSG9zdCAiW09LXSByY2xvdWRmbGFyZWQgYWxyZWFkeSBpbnN0YWxsZWQuIg0KfQ0KDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgVmVyc2lvbg0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KJiAkQ2xvdWRmbGFyZWQgLS12ZXJzaW9uDQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KIyBQb3J0DQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0KJERlZmF1bHRQb3J0ID0gMzMwNg0KDQokaW5wdXRQb3J0ID0gUmVhZC1Ib3N0ICJMb2NhbCBNeVNRTCBwb3J0IFskRGVmYXVsdFBvcnRdIg0KDQppZiAoW3N0cmluZ106OklzTnVsbE9yV2hpdGVTcGFjZSgkaW5wdXRQb3J0KSkgew0KICAgICRQb3J0ID0gJERlZmF1bHRQb3J0DQp9DQplbHNlIHsNCiAgICAkUG9ydCA9IFtpbnRdJElucHV0UG9ydA0KfQ0KDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiMgQ2hlY2sgcG9ydA0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCg0Kd2hpbGUgKCR0cnVlKSB7DQoNCiAgICAkVXNlZCA9IEdldC1OZXRUQ1BDb25uZWN0aW9uIGANCiAgICAgICAgLUxvY2FsUG9ydCAkUG9ydCBgDQogICAgICAgIC1TdGF0ZSBMaXN0ZW4gYA0KICAgICAgICAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZQ0KDQogICAgaWYgKCRudWxsIC1lcSAkVXNlZCkgew0KICAgICAgICBicmVhaw0KICAgIH0NCg0KICAgIFdyaXRlLUhvc3QgIltXQVJOXSBQb3J0ICRQb3J0IGlzIGFscmVhZHkgaW4gdXNlLiINCg0KICAgICRQb3J0KysNCg0KICAgIFdyaXRlLUhvc3QgIltJTkZPXSBUcnlpbmcgcG9ydCAkUG9ydC4uLiINCn0NCg0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KIyBTdGFydA0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KDQpXcml0ZS1Ib3N0ICIiDQpXcml0ZS1Ib3N0ICI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSINCldyaXRlLUhvc3QgIiBNeVNRTCBDb25uZWN0aW9uIg0KV3JpdGUtSG9zdCAiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSINCldyaXRlLUhvc3QgIiINCg0KV3JpdGUtSG9zdCAiUmVtb3RlOiINCldyaXRlLUhvc3QgIiAgJENsb3VkZmxhcmVIb3N0bmFtZSINCg0KV3JpdGUtSG9zdCAiIg0KV3JpdGUtSG9zdCAiTG9jYWw6Ig0KV3JpdGUtSG9zdCAiICBIb3N0IDogMTI3LjAuMC4xIg0KV3JpdGUtSG9zdCAiICBQb3J0IDogJFBvcnQiDQoNCldyaXRlLUhvc3QgIiINCldyaXRlLUhvc3QgIk5vZGUtUkVEIC8gTXlTUUw6Ig0KV3JpdGUtSG9zdCAiICBIb3N0ID0gMTI3LjAuMC4xIg0KV3JpdGUtSG9zdCAiICBQb3J0ID0gJFBvcnQiDQoNCldyaXRlLUhvc3QgIiINCldyaXRlLUhvc3QgIlN0YXJ0aW5nIENsb3VkZmxhcmUgQWNjZXNzLi4uIg0KV3JpdGUtSG9zdCAiUHJlc3MgQ3RybCtDIHRvIGRpc2Nvbm5lY3QuIg0KV3JpdGUtSG9zdCAiIg0KDQomICRDbG91ZGZsYXJlZCBhY2Nlc3MgdGNwIGANCiAgICAtLWhvc3RuYW1lICRDbG91ZGZsYXJlSG9zdG5hbWUgYA0KICAgIC0tdXJsICIxMjcuMC4wLjE6JFBvcnQi`;

function decodeBase64(b64) {
  const binaryString = atob(b64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloudflare MySQL Training Tunnel Client</title>
  <meta name="description" content="คู่มือและสคริปต์เชื่อมต่อฐานข้อมูล MySQL Training ผ่าน Cloudflare Access TCP Tunnel สำหรับ Windows, macOS และ Linux">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0a0f1d;
      --bg-card: rgba(17, 24, 39, 0.75);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(99, 102, 241, 0.4);
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.25);
      --cyan: #06b6d4;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --code-bg: #030712;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', 'Noto Sans Thai', sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      line-height: 1.6;
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 65%, rgba(6, 182, 212, 0.12) 0%, transparent 45%),
        linear-gradient(180deg, #090d16 0%, #030712 100%);
      background-attachment: fixed;
      padding-bottom: 5rem;
    }
    .container { max-width: 1000px; margin: 0 auto; padding: 2.5rem 1.5rem; }
    header { text-align: center; margin-bottom: 3.5rem; }
    .badge-status {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.35rem 0.9rem; border-radius: 9999px;
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.25rem;
    }
    .status-dot {
      width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; } }
    h1 {
      font-size: 2.5rem; font-weight: 800; letter-spacing: -0.025em;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.75rem;
    }
    .subtitle { color: var(--text-muted); font-size: 1.125rem; max-width: 680px; margin: 0 auto; }
    .card {
      background: var(--bg-card); backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border-color);
      border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .card-title {
      font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;
    }
    .card-title svg { color: var(--cyan); }
    .tabs-wrapper { margin-bottom: 1.75rem; }
    .tab-list {
      display: flex; gap: 0.75rem; background: rgba(3, 7, 18, 0.6);
      padding: 0.4rem; border-radius: 0.875rem; border: 1px solid var(--border-color);
    }
    .tab-btn {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 0.6rem; padding: 0.8rem 1.25rem; border-radius: 0.65rem; border: none;
      background: transparent; color: var(--text-muted); font-family: inherit;
      font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.2));
      color: #fff; border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .code-box-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-dim); }
    .code-box {
      background: var(--code-bg); border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.875rem; padding: 1.15rem 1.25rem; margin-bottom: 1.25rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; overflow: hidden;
    }
    .code-box pre {
      margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.92rem;
      color: #38bdf8; overflow-x: auto; white-space: nowrap;
    }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem 1.4rem; border-radius: 0.75rem; font-family: inherit; font-size: 0.95rem;
      font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.2s ease; border: none;
    }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
    .btn-primary:hover { background: linear-gradient(135deg, #7175f7, #5b53ee); transform: translateY(-1px); }
    .btn-secondary { background: rgba(255, 255, 255, 0.06); color: #e2e8f0; border: 1px solid var(--border-color); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
    .btn-copy {
      padding: 0.5rem 0.85rem; font-size: 0.82rem; border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.08); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;
    }
    .btn-copy:hover { background: rgba(255, 255, 255, 0.16); color: #fff; }
    .action-group { display: flex; flex-wrap: wrap; gap: 0.85rem; align-items: center; margin-top: 1rem; }
    .steps-list { list-style: none; counter-reset: step-counter; display: flex; flex-direction: column; gap: 1.25rem; margin: 1.5rem 0; }
    .step-item { position: relative; padding-left: 3rem; }
    .step-item::before {
      counter-increment: step-counter; content: counter(step-counter);
      position: absolute; left: 0; top: 0; width: 2.1rem; height: 2.1rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2));
      border: 1px solid rgba(99, 102, 241, 0.4); color: #38bdf8; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .step-title { font-weight: 700; color: #fff; margin-bottom: 0.3rem; }
    .step-desc { color: var(--text-muted); font-size: 0.93rem; }
    .db-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.25rem; }
    .db-item { background: rgba(3, 7, 18, 0.6); border: 1px solid var(--border-color); border-radius: 0.85rem; padding: 1rem 1.15rem; }
    .db-item-label { font-size: 0.8rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.35rem; font-weight: 600; }
    .db-item-value {
      font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; font-weight: 600;
      color: #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
    }
    .alert-box { border-radius: 0.85rem; padding: 1.1rem 1.25rem; margin-top: 1.25rem; display: flex; align-items: flex-start; gap: 0.85rem; font-size: 0.92rem; }
    .alert-warning { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); color: #fcd34d; }
    .alert-info { background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); color: #7dd3fc; }
    .toast {
      position: fixed; bottom: 2rem; right: 2rem; background: #10b981; color: #fff;
      padding: 0.75rem 1.25rem; border-radius: 0.75rem; font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); transform: translateY(100px); opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index: 100;
    }
    .toast.show { transform: translateY(0); opacity: 1; }
    footer { text-align: center; margin-top: 3.5rem; color: var(--text-dim); font-size: 0.875rem; }
    @media (max-width: 640px) {
      h1 { font-size: 1.85rem; }
      .container { padding: 1.5rem 1rem; }
      .card { padding: 1.35rem; }
      .tab-btn { padding: 0.65rem 0.75rem; font-size: 0.85rem; }
      .db-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge-status">
        <span class="status-dot"></span>
        Cloudflare Tunnel Active &bull; boi-tfm-db.kttechsolution.com
      </div>
      <h1>เชื่อมต่อ MySQL Database Training</h1>
      <p class="subtitle">
        ระบบเชื่อมต่อฐานข้อมูล MySQL ผ่าน Cloudflare Access TCP ปลอดภัย ไม่ต้องเปิด Public Port เพียงรันสคริปต์ 1 ครั้งก็เชื่อมต่อได้ทันที
      </p>
    </header>

    <div class="card">
      <div class="card-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        เลือกระบบปฏิบัติการและดาวน์โหลดสคริปต์
      </div>

      <div class="tabs-wrapper">
        <div class="tab-list">
          <button class="tab-btn active" id="tab-btn-win" onclick="switchTab('win')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
            Windows (PowerShell)
          </button>
          <button class="tab-btn" id="tab-btn-unix" onclick="switchTab('unix')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
            macOS / Linux / WSL (Bash)
          </button>
        </div>
      </div>

      <!-- Windows Tab -->
      <div id="tab-win" class="tab-content active">
        <div class="code-box-header">
          <span>⚡ วิธีที่ 1: รันคำสั่งทันที (One-liner ใน PowerShell)</span>
          <span>แนะนำ</span>
        </div>
        <div class="code-box">
          <pre><code id="code-win">irm <span class="host-url">...</span>/windows | iex</code></pre>
          <button class="btn-copy" onclick="copySnippet('code-win')">Copy</button>
        </div>

        <div class="code-box-header">
          <span>📦 วิธีที่ 2: ดาวน์โหลดไฟล์สคริปต์ไปรันเอง</span>
        </div>
        <div class="action-group">
          <a id="link-dl-win" href="/windows-connect-db.ps1" class="btn btn-primary">
            ดาวน์โหลด windows-connect-db.ps1
          </a>
          <button class="btn btn-secondary" onclick="copyCustom('powershell -ExecutionPolicy Bypass -File .\\\\windows-connect-db.ps1')">
            Copy คำสั่งรันไฟล์ที่โหลด
          </button>
        </div>

        <div class="alert-box alert-warning">
          <div>
            <strong>ข้อควรรู้สำหรับ Windows:</strong> หากติดสิทธิ์ Execution Policy ให้เปิด PowerShell แล้วรันคำสั่ง <code>Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code> ก่อนรันสคริปต์
          </div>
        </div>
      </div>

      <!-- Unix Tab -->
      <div id="tab-unix" class="tab-content">
        <div class="code-box-header">
          <span>⚡ วิธีที่ 1: รันคำสั่งทันที (One-liner ใน Terminal)</span>
          <span>แนะนำ</span>
        </div>
        <div class="code-box">
          <pre><code id="code-unix">curl -sSL <span class="host-url">...</span>/unix | bash</code></pre>
          <button class="btn-copy" onclick="copySnippet('code-unix')">Copy</button>
        </div>

        <div class="code-box-header">
          <span>📦 วิธีที่ 2: ดาวน์โหลดไฟล์สคริปต์ไปรันเอง</span>
        </div>
        <div class="action-group">
          <a id="link-dl-unix" href="/unix-connect-db.sh" class="btn btn-primary">
            ดาวน์โหลด unix-connect-db.sh
          </a>
          <button class="btn btn-secondary" onclick="copyCustom('chmod +x unix-connect-db.sh && ./unix-connect-db.sh')">
            Copy คำสั่ง chmod & run
          </button>
        </div>

        <div class="alert-box alert-info">
          <div>
            <strong>รองรับทุกแพลตฟอร์ม:</strong> Linux x86_64, Linux ARM64, macOS Apple Silicon (M1/M2/M3), macOS Intel และ WSL บน Windows สคริปต์จะตรวจสอบสถาปัตยกรรมและติดตั้ง cloudflared ให้อัตโนมัติ
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions Step by Step -->
    <div class="card">
      <div class="card-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
        ขั้นตอนการทำงานของสคริปต์
      </div>
      <ol class="steps-list">
        <li class="step-item">
          <div class="step-title">เปิด Terminal หรือ PowerShell แล้วรันคำสั่ง</div>
          <div class="step-desc">สคริปต์จะตรวจสอบและดาวน์โหลด <code>cloudflared</code> binary ของแท้จาก Cloudflare GitHub ให้เองโดยอัตโนมัติ (เก็บไว้ในโฟลเดอร์ <code>~/.mysql-training/bin</code>)</div>
        </li>
        <li class="step-item">
          <div class="step-title">เลือก Local Port (ค่าเริ่มต้น: 3306)</div>
          <div class="step-desc">หากคุณมี MySQL รันอยู่ในเครื่องอยู่แล้ว สคริปต์จะตรวจจับพอร์ตที่ชนให้อัตโนมัติและขยับเป็น 3307 หรือ 3308 ทันที</div>
        </li>
        <li class="step-item">
          <div class="step-title">เปิด Terminal ทิ้งไว้เพื่อรักษาการเชื่อมต่อ</div>
          <div class="step-desc">เมื่อขึ้นข้อความ <code>Starting Cloudflare Access...</code> แปลว่า Tunnel พร้อมใช้งานแล้ว <strong>ห้ามปิดหน้าต่างนี้</strong> หากต้องการหยุดให้กด <kbd>Ctrl + C</kbd></div>
        </li>
        <li class="step-item">
          <div class="step-title">เชื่อมต่อโปรแกรม DB Client / Node-RED</div>
          <div class="step-desc">ใช้ข้อมูล Host เป็น <code>127.0.0.1</code> และ Port ที่แสดงบนหน้าจอ เพื่อเข้าสู่ฐานข้อมูลได้ทันที</div>
        </li>
      </ol>
    </div>

    <!-- Credentials -->
    <div class="card">
      <div class="card-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        ข้อมูลการเชื่อมต่อ MySQL (Database Credentials)
      </div>
      <div class="db-grid">
        <div class="db-item">
          <div class="db-item-label">Host / Server</div>
          <div class="db-item-value"><span>127.0.0.1</span> <button class="btn-copy" onclick="copyCustom('127.0.0.1')">Copy</button></div>
        </div>
        <div class="db-item">
          <div class="db-item-label">Port</div>
          <div class="db-item-value"><span>3306</span> <button class="btn-copy" onclick="copyCustom('3306')">Copy</button></div>
        </div>
        <div class="db-item">
          <div class="db-item-label">Database Name</div>
          <div class="db-item-value"><span>boi</span> <button class="btn-copy" onclick="copyCustom('boi')">Copy</button></div>
        </div>
        <div class="db-item">
          <div class="db-item-label">Username</div>
          <div class="db-item-value"><span>training</span> <button class="btn-copy" onclick="copyCustom('training')">Copy</button></div>
        </div>
        <div class="db-item">
          <div class="db-item-label">Password</div>
          <div class="db-item-value">
            <span id="pwd-text">••••••••</span>
            <div style="display:flex; gap:0.25rem;">
              <button class="btn-copy" id="pwd-toggle-btn" onclick="togglePassword()">Show</button>
              <button class="btn-copy" onclick="copyCustom('12345687')">Copy</button>
            </div>
          </div>
        </div>
        <div class="db-item">
          <div class="db-item-label">Cloudflare Hostname</div>
          <div class="db-item-value" style="font-size:0.82rem;">
            <span>boi-tfm-db.kttechsolution.com</span>
            <button class="btn-copy" onclick="copyCustom('boi-tfm-db.kttechsolution.com')">Copy</button>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <p>Cloudflare MySQL Training Tunnel Client Portal &bull; Secured with Cloudflare Access</p>
    </footer>
  </div>

  <div id="toast" class="toast"><span id="toast-msg">คัดลอกลงคลิปบอร์ดแล้ว!</span></div>

  <script>
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
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
      document.querySelectorAll('.host-url').forEach(el => { el.textContent = origin; });
      if (origin.startsWith('http')) {
        document.getElementById('link-dl-win').href = origin + '/windows-connect-db.ps1';
        document.getElementById('link-dl-unix').href = origin + '/unix-connect-db.sh';
      }
    }
    function showToast(text) {
      const toast = document.getElementById('toast');
      const msg = document.getElementById('toast-msg');
      msg.textContent = text || 'คัดลอกลงคลิปบอร์ดแล้ว!';
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 2500);
    }
    function copySnippet(elementId) {
      const el = document.getElementById(elementId);
      if (el) copyCustom(el.innerText);
    }
    function copyCustom(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('คัดลอก: ' + (text.length > 30 ? text.substring(0, 30) + '...' : text));
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
      try { document.execCommand('copy'); showToast('คัดลอกสำเร็จ!'); } catch (err) {}
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
      // Injects the current worker origin directly into the HTML
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
