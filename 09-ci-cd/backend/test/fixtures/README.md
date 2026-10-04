# Security review training fixtures

`security-cases.json` contains intentionally vulnerable code snippets as plain
text for security-review practice. They are inert data: the backend does not
load or execute them, and they must not be copied into application routes.

The backend test command validates the fixture catalog without executing the
snippets. Keep any future examples in this directory and label them clearly as
training data.
