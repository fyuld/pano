# Clear Conditional Purpose

## Preferences

- Points: 20
- Quality Criteria:
  - Readability

## Description

Conditional expressions should be clear to follow and simple to understand.

## Purpose

AIs and Humans should have no problem understanding the product level, architecture level, or business level decision behind each logical fork.

## Implementation

When more than one term is needed to decide something, declare self-documenting constant to ensure that code is easy to understand.

Consider bad code:

```
if(session.exist() && (session.ttl < currentTime ||  StaticStorage.isSecurityAlert())) {
  logout();
}
```

Replace with good and self documenting code:

```
const isSessionExpired = session.exist() && session.ttl < currentTime
const isForcedLogout = session.exists() && StaticStorage.isSecurityAlert()

if (isSessionExpired) {
  logout();
} else if (isForcedLogout) {
  logout();
}
```

Latter example documents code through variable name, and makes sure that whoever edits the code, human or AI has clear idea what happend.

Now we also know all the reasons why user might be logged out, either session expired, or there was security alert that invalidated sessions. 

### Constraints

- $.complexConditionalExpressions[*]

### Default Agent Recommendation

When fixing following problem, evaluate each of the remarks, and derive an understandable and self documenting constant name.

Then present user with table that contains following columns:
- Remark id
- Link to file (name:line)
- Recommended constant name
- Current statements and terms.