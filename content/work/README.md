# Resume + Work section

This folder is the source for the Work and CV sections.

Current files:
- `product-resume.pdf`
- `founders-office-resume.pdf`
- `resume.json`

The website reads `resume.json` for the Work cards and the two CV links.

## When you update your resume

1. Replace the relevant PDF in this folder.
2. Keep the same filename if possible.
3. Update the `work` array in `resume.json` with the achievements you want highlighted.

If you do not want to edit the JSON yourself, upload the new resume here and tell ChatGPT:
**"sync my Work section from the new resume in content/work"**.
It can read the resume and rewrite resume.json while preserving the site's design.

This separation means you can keep updating your resume without touching the portfolio layout/code.
