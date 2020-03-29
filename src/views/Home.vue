<template>
  <div class="home">
    <CovidProbability/>
  </div>
</template>

<script>
// @ is an alias to /src
import CovidProbability from "@/components/CovidProbability";

export default {
  name: 'Home',
  components: {
    CovidProbability
  }
}
</script>
