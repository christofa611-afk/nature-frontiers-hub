<!-- Inside the .card div -->
<div class="badge" :class="item.type">
  {{ item.type === 'video' ? '▶ WATCH NOW' : '📰 NEWS' }}
</div>
<!-- Add this to your <style> section -->
.badge.video { background: #e50914; color: white; } /* Netflix Red for videos */
.badge.news { background: #2c3e50; color: #ecf0f1; } /* Dark Blue for news */
