# GPM parama

**Making Lithuania's open GPM support data more accessible, understandable and interesting to the public.**

[Explore the website](https://ramuneid.github.io/gpm-parama/)

Public data should be useful beyond spreadsheets. GPM parama turns publicly available Lithuanian State Tax Inspectorate (VMI) data for 2020-2025 into a free, Lithuanian-language website where anyone can find an organisation, explore its funding history and compare it with others.

Visitors can search by name or organisation code, filter recipients, and explore calculated support, transferred amounts and request counts. The main page includes all recorded recipients, with separate views for political parties and trade unions.

## Guiding principles

- **Open to everyone.** Free access, no registration, and a simple search-first experience.
- **Clarity before complexity.** Readable charts, tables and explanations help people explore the data without specialist knowledge.
- **Transparent definitions.** Calculated support and transferred amounts are shown separately. Missing data is not presented as zero, and request counts are not treated as counts of unique supporters.
- **Responsible interpretation.** Funding is not a measure of an organisation's impact. The website does not identify an individual's contribution or show how organisations spent the money. Historical records do not establish current eligibility for support.
- **Privacy and transparency.** Cloudflare Web Analytics loads only after consent. The website discloses its use of AI tools and its AI-generated illustration.
- **Continuous improvement.** This is an independent, work-in-progress project, open to questions, corrections and suggestions.

## How it is built

Data preparation, cleaning and analysis are carried out in Python. The website uses HTML, CSS, JavaScript and Chart.js, with static JSON data, and is hosted on GitHub Pages. AI tools assisted website development.

The data pipeline and analysis live in a [separate repository](https://github.com/Ramuneid/lithuania-gpm-support-analysis). See the [methodology](https://github.com/Ramuneid/lithuania-gpm-support-analysis/blob/main/METHODOLOGY.md) for processing choices and limitations, including the calculated-amount correction for records with zero requests.

## Contact

Created by **Ramune Idzelyte**. Questions or observations? [Contact me on LinkedIn](https://www.linkedin.com/in/idzelyte/).
