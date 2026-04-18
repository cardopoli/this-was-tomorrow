<script>
document.querySelectorAll('.carousel-next').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.target.closest('.carousel-section').querySelector('.carousel').scrollLeft += 600;
  });
});

document.querySelectorAll('.carousel-prev').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.target.closest('.carousel-section').querySelector('.carousel').scrollLeft -= 600;
  });
});
</script>
