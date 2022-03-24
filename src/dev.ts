import { parseIngredient } from '.';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerText = JSON.stringify(parseIngredient('1 cup of stuff'));
