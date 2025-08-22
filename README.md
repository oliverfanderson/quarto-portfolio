# Data Science Portfolio Website

A professional portfolio website showcasing data science projects, analyses, and visualizations. Built with Quarto to demonstrate expertise in data wrangling, statistical analysis, and interactive data visualization through real-world projects including Super Bowl analytics, RNA-seq bioinformatics pipelines, and more.

## Overview

This portfolio highlights my work in:
- **Data Analysis & Visualization**: Interactive charts and statistical insights
- **Bioinformatics**: RNA-seq data processing and enzymatic pathway analysis
- **Web Development**: Responsive design with modern data visualization libraries
- **Reproducible Research**: Literate programming with Quarto

## Dependencies

### Core Requirements
- **R** (>= 4.0.0)
- **Quarto** (>= 1.2.0)

### R Packages
```r
# Data manipulation and visualization
install.packages(c(
  "tidyverse",      # Data wrangling and ggplot2
  "DT",             # Interactive data tables
  "gt",             # Grammar of tables
  "lubridate"       # Date/time manipulation
))

# Interactive visualizations
install.packages(c(
  "ggiraph",        # Interactive ggplot2 graphics
  "plotly",         # Interactive web-based plots
  "colorspace"      # Color palette utilities
))

# Plot composition and styling
install.packages(c(
  "ggpubr",         # Publication-ready plots
  "patchwork"       # Combining multiple plots
))

# Web scraping and data import
install.packages(c(
  "rvest",          # Web scraping
  "jsonlite"        # JSON data handling
))
```

## Getting Started
1. Clone the repository
```bash
git clone https://github.com/oliverfanderson/quarto-portfolio.git
cd quarto-portfolio
```
2. Install dependencies
```
# Run the R package installation code above
```
3. Render the website
```bash
quarto render
```
4. Preview locally
```bash
quarto preview
```
### Project Structure
- `index.qmd` - Homepage
- `about.qmd` - About page
- `projects.qmd` - Projects overview
- `contact.qmd` - Contact information
- `posts/` - Individual project posts
- `images/` - Static assets
- `styles.css` - Custom styling
- `_quarto.yml` - Site configuration
### Features
- **Responsive Design**: Mobile-friendly layout
- **Interactive Visualizations**: Plotly and ggiraph integration
- **Professional Tables**: Publication-ready tables with gt
- **SEO Optimized**: Meta tags and social media integration
- **Fast Loading**: Optimized assets and modern web standards
### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.