<template>
  <div class="container">
    <header>
      <h1>Nature Frontiers</h1>
      <p>Wildlife Documentaries & Global Nature News</p>
    </header>

    <div class="grid">
      <div v-for="item in content" :key="item.id" class="card" :class="item.type">
        <a :href="item.link" target="_blank" class="link-overlay"></a>
        <img :src="item.image" :alt="item.title" />
        <div class="badge">{{ item.type === 'video' ? '▶ WATCH' : '📰 NEWS' }}</div>
        <div class="info">
          <h3>{{ item.title }}</h3>
          <span class="date">{{ item.date }}</span>
        </div>
      </div>
    </div>
    
    <footer>
      <p>© 2024 Nature Frontiers. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const content = ref([]);

onMounted(async () => {
  try {
    const res = await fetch('./data/content.json');
    content.value = await res.json();
  } catch (e) {
    console.error("Loading...", e);
  }
});
</script>

<style>
  body { margin: 0; font-family: 'Helvetica Neue', sans-serif; background: #0b0f19; color: #fff; }
  .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
  header { text-align: center; padding: 60px 0; }
  h1 { font-size: 3.5rem; margin: 0; background: linear-gradient(to right, #4facfe, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; }
  .card { position: relative; background: #151b2b; border-radius: 12px; overflow: hidden; transition: transform 0.3s; cursor: pointer; }
  .card:hover { transform: translateY(-8px); }
  .card img { width: 100%; height: 180px; object-fit: cover; opacity: 0.8; }
  .card.video img { opacity: 1; }
  .badge { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
  .info { padding: 15px; }
  h3 { margin: 0 0 8px; font-size: 1.1rem; line-height: 1.4; }
  .date { color: #8899a6; font-size: 0.85rem; }
  .link-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; }
  footer { text-align: center; padding: 40px; color: #555; font-size: 0.9rem; }
</style>
