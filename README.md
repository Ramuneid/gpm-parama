# GPM parama

**Making Lithuania's open GPM support data more accessible, understandable and interesting to the public.**

[Explore the website](https://ramuneid.github.io/gpm-parama/)

Public data should be useful beyond spreadsheets. GPM parama turns publicly available Lithuanian State Tax Inspectorate (VMI) data for 2020-2025 into a free, Lithuanian-language website where anyone can find an organisation, explore its funding history and compare it with others.

Search by name or organisation code, narrow the results by year, municipality or funding size, and compare organisations side by side. Interactive charts and annual tables bring together calculated support, transferred amounts and request counts. The main page includes all recorded recipients, with dedicated views for political parties and trade unions.

## Guiding principles

- **Open to everyone.** Free, direct access and a search-first experience make public data easy to explore.
- **Make the data understandable.** Readable charts, annual tables and plain-language explanations turn source records into information people can use.
- **Encourage curiosity.** Funding histories, filters and side-by-side comparisons help visitors discover patterns and ask their own questions.
- **Keep the process transparent.** Clearly labelled measures distinguish calculated and transferred support, while the published methodology explains how the data is prepared and interpreted.
- **Respect visitor choice.** Visitors control whether Cloudflare Web Analytics is enabled through the site's consent settings.
- **Improve through feedback.** This independent, evolving project welcomes questions, corrections and ideas from the people who use it.

## How it is built

Python is used throughout data preparation, cleaning and analysis. The prepared data is exported as JSON for a lightweight website built with HTML, CSS, JavaScript and Chart.js, and hosted on GitHub Pages. AI tools assisted website development and the creation of its decorative illustration.

Explore the data pipeline and analysis in the [Python project repository](https://github.com/Ramuneid/lithuania-gpm-support-analysis), or read the [methodology](https://github.com/Ramuneid/lithuania-gpm-support-analysis/blob/main/METHODOLOGY.md) for data definitions, processing decisions and interpretation guidance.

## Contact

Created by **Ramune Idzelyte**. Questions or observations? [Contact me on LinkedIn](https://www.linkedin.com/in/idzelyte/).
