document.addEventListener('DOMContentLoaded', () => {
    // Handle locked course clicks
    const lockedCourses = document.querySelectorAll('.course-card.locked');
    lockedCourses.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();

            // Simple shake animation for feedback
            card.style.transform = 'translate(5px, 0)';
            setTimeout(() => card.style.transform = 'translate(-5px, 0)', 50);
            setTimeout(() => card.style.transform = 'translate(5px, 0)', 100);
            setTimeout(() => card.style.transform = 'translate(-5px, 0)', 150);
            setTimeout(() => card.style.transform = 'translate(0, 0)', 200);
        });
    });
});
