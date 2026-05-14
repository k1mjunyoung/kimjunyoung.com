---
name: commit-message-convention
description: 커밋 메세지를 작성할 때 사용합니다.
---

커밋 메세지를 작성할 때 다음 지시사항을 따르세요.
단, 제목은 영어로 작성하되 본문은 한국어로 작성하세요.
Co-Authored-By는 작성하지 마세요.

```
Capitalized, short (50 chars or less) summary

More detailed explanatory text, if necessary.  Wrap it to about 72
characters or so.  In some contexts, the first line is treated as the
subject of an email and the rest of the text as the body.  The blank
line separating the summary from the body is critical (unless you omit
the body entirely); tools like rebase will confuse you if you run the
two together.

Write your commit message in the imperative: "Fix bug" and not "Fixed bug"
or "Fixes bug."  This convention matches up with commit messages generated
by commands like git merge and git revert.

Further paragraphs come after blank lines.

- Bullet points are okay, too

- Typically a hyphen or asterisk is used for the bullet, followed by a
  single space, with blank lines in between, but conventions vary here
- Use a hanging indent
```
