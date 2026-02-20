---
layout: post
lang: en
published: true
permalink: /en/ui-redesign-using-thymeleaf-layout
commit_url:
date: 2026-01-21 16:41:29 +0900
link:
domain:
title: UI Redesign Using Thymeleaf Layout
description: ''
categories:
redirect_from:
  - /en/ui-redesign-using-thymeleaf-layout
---

## Introduction



This project started with the request to "write custom CSS only for difficult parts with Bootstrap." I would like to share the experiences and solutions encountered while completely renewing the legacy UI to a modern SNS style.



## Problem Situation



The existing blog followed a traditional web blog layout. However, a transition to an SNS feed format like Twitter was needed to improve user experience and provide a more modern interface. Particularly, as a backend developer constructing the frontend directly, there were the following concerns.



- Easy-to-maintain structure

- Code reusability with minimal duplication

- Consistent design system application

- Mobile responsive support



## Technology Choice: Thymeleaf Layout Pattern



The first technology applied was a hierarchical template structure utilizing Thymeleaf's Layout Dialect.



```textmate

implementation 'nz.net.ultraq.thymeleaf:thymeleaf-layout-dialect:3.3.0'

```





### Layout Hierarchy Structure



```

layouts/default.html (base layout)

├── fragments/components.html (all reusable components)

│   ├── navbar

│   ├── sidebar-left

│   ├── sidebar-right

│   ├── post-card

│   └── mobile-nav

└── Each page (index.html, viewer.html, etc.)

```





Through this structure, consistent header, sidebar, and footer could be automatically applied to all pages. When adding a new page, simply declare `layout:decorate="~{layouts/default}"` and focus only on `layout:fragment="content"`.



## Building Design System



### Maintaining Brand Consistency



All colors, sizes, and styles were defined as CSS variables and utility classes.



```css

/* Brand color */

.brand-color {

    color: #4A7822;

}



.post-action-btn {

    text-decoration: none !important;

    border-radius: 50px;

    padding: 6px 12px !important;

    transition: all 0.2s ease;

}



.post-action-btn:hover {

    background-color: rgba(74, 120, 34, 0.1);

    color: #4A7822 !important;

}

```





While maximizing use of Bootstrap's default styles, custom CSS was written only for parts requiring project-specific design. This minimized CSS file size while maintaining brand consistency.



## Key Implementation Details



### 1. Responsive Layout



Utilized Bootstrap's grid system while particularly considering mobile usability.



```html

<div class="container-fluid main-container">

    <div class="row justify-content-center">

        <!-- Left sidebar: displayed only on desktop -->

        <aside class="col-lg-2 d-none d-lg-block sidebar-left">

            ...

        </aside>



        <!-- Main content -->

        <main class="col-12 col-lg-6 main-content px-0">

            ...

        </main>



        <!-- Right sidebar: displayed only on desktop -->

        <aside class="col-lg-3 d-none d-lg-block sidebar-right">

            ...

        </aside>

    </div>

</div>



<!-- Mobile bottom navigation: displayed only at screen size 992px or below -->

<nav class="d-lg-none mobile-nav">

    ...

</nav>

```





Designed to provide rich information with a 3-column layout on desktop, while focusing on main content on mobile. Particularly, fixed bottom navigation was implemented for mobile users to have constant access.



### 2. Post Length Control and Show More Functionality



To prevent user inconvenience from long posts in the feed, posts exceeding 300px automatically expose a "show more" button with fade effect.



```javascript

function checkHeightAndFade(viewerEl) {

    const wrapper = viewerEl.closest('.post-content-wrapper');

    const maxHeight = 300;



    if (viewerEl.offsetHeight > maxHeight) {

        wrapper.classList.add('has-fade');

        const showMoreBtn = wrapper.parentElement.querySelector('.show-more-btn');

        if (showMoreBtn) showMoreBtn.classList.remove('d-none');

    }

}



function togglePostContent(btn) {

    const wrapper = document.querySelector(btn.getAttribute('data-target'));

    if (wrapper.classList.contains('expanded')) {

        wrapper.classList.remove('expanded');

        btn.textContent = 'Show more';

    } else {

        wrapper.classList.add('expanded');

        btn.textContent = 'Collapse';

    }

}

```





Provided smooth user experience through fade effect using CSS's `max-height` property and gradient.



### 3. Editor Screen Optimization



Initially, there was inconsistent behavior where sometimes the editor scrolled and sometimes the page itself scrolled. To solve this, we conducted a complete layout redesign using Flexbox.



```css

html, body {

    height: 100%;

    margin: 0;

    padding: 0;

    overflow: hidden;

}



#postForm {

    display: flex;

    flex-direction: column;

    height: 100vh;

    overflow: hidden;

}



.editor-body {

    flex: 1;

    display: flex;

    flex-direction: column;

    overflow: hidden;

}



#editor {

    flex: 1;

    overflow: hidden !important;

}

```





This removed entire page scroll and limited scroll to occur only inside the editor. As a result, users can always see the header and title input field, creating an environment to focus only on the editor.



## Lessons Learned



### 1. Frontend Is Not Backend's Responsibility, But



When backend developers construct UI, it's important to maximize use of framework and library default features. Tools like Bootstrap or Thymeleaf already provide proven patterns, so using them correctly can yield surprisingly efficient results.



### 2. Modularization and Reusability



Component-based development utilizing Thymeleaf fragments applies equally to templates. Keeping each component independent minimizes the impact scope when changing styles or adding features later.



### 3. Importance of Responsive Design



As mobile user proportion increases, responsive design is not optional but essential. Particularly, SNS-style feeds should provide even more natural user experience on mobile.



## Conclusion



Through this project, I learned that backend developers can also construct professional-level frontend by understanding basic UI/UX principles and utilizing appropriate tools. While it cannot completely replace professional frontend developers' sensibility, it's certainly possible in small teams or personal projects.



Particularly, the combination of Thymeleaf layout pattern and Bootstrap is a more powerful tool than expected. Using it allows fast and consistent web interface construction, making future maintenance much easier.
