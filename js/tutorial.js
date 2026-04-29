const progressBar = document.querySelector("[data-page-progress]");
const chapterLinks = [...document.querySelectorAll(".tutorial-nav a[href^='#']")];
const sections = chapterLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

const syncProgress = () => {
    if (!progressBar) {
        return;
    }

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
    progressBar.style.setProperty("--progress", `${Math.min(100, Math.max(0, progress))}%`);
};

syncProgress();
window.addEventListener("scroll", syncProgress, { passive: true });
window.addEventListener("resize", syncProgress);

document.querySelectorAll(".code-block").forEach((block) => {
    const code = block.querySelector("code");
    if (!code) {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code";
    button.textContent = "Copy";
    block.appendChild(button);

    button.addEventListener("click", async () => {
        const text = code.textContent;

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                textarea.remove();
            }

            button.textContent = "Copied";
            window.setTimeout(() => {
                button.textContent = "Copy";
            }, 1400);
        } catch {
            button.textContent = "Select";
            window.setTimeout(() => {
                button.textContent = "Copy";
            }, 1400);
        }
    });
});

if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
            return;
        }

        chapterLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
    }, {
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0.16, 0.32, 0.5]
    });

    sections.forEach((section) => observer.observe(section));
}
