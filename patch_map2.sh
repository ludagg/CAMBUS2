sed -i 's/if (start) {/if (start.lat \&\& start.lng) {/g' components/SearchResultsPage.tsx
