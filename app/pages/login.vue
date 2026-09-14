<script setup lang="ts">
// Placeholder login page — real auth is wired in PH-2 (P2-01).
// Preview page: marked as synthetic until connected to the API.
</script>

<template>
  <section :class="$style.wrap">
    <h1>Masuk</h1>
    <AppAlert kind="info" message="Halaman pratinjau — autentikasi dihubungkan pada fase PH-2." />
    <form :class="$style.form" @submit.prevent>
      <AppRadioGroup
        legend="Jenis akun"
        name="login-kind"
        :options="[
          { value: 'STUDENT', label: 'Mahasiswa', description: 'Masuk dengan NIM' },
          { value: 'LECTURER', label: 'Dosen', description: 'Masuk dengan NIP' },
          { value: 'ADMIN', label: 'Panitia', description: 'Akun admin terpisah' },
        ]"
      />
      <AppInput label="NIM / NIP" required inputmode="numeric" hint="Nomor identitas lokal dari panitia" />
      <AppInput label="Password" type="password" required autocomplete="current-password" />
      <AppButton type="submit" block>Masuk</AppButton>
    </form>
  </section>
</template>

<style module>
.wrap { max-width: 24rem; margin: 0 auto; }
.form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
</style>
