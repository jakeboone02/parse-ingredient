import { parseIngredient } from '.';

declare const hljs: any;

const seed = `For The Buttercream (or make a cream cheese frosting)
4 large egg whites
1 cup packed light-brown sugar
1/4 teaspoon salt
1 ½ cups (3 sticks) unsalted butter, room temperature, cut into pieces

For The Cake
1/2 cup (1 stick) unsalted butter, melted, plus more for pans
2 cups all-purpose flour (spooned and leveled), plus more for pans
2 teaspoons baking soda
1/2 teaspoon baking powder
2 teaspoons of ground cinnamon
1/2 teaspoon ground ginger
3⁄4 teaspoon salt
2 cups packed light-brown sugar
2 large eggs
4 Granny Smith apples, peeled, two coarsely grated and two diced
`;

document.getElementById('ingredient-list')!.innerHTML = seed;

document.getElementById('parse')!.addEventListener('click', function (event) {
  var normalizeUOM = (
    document.getElementById('normalize-uom') as HTMLInputElement
  ).checked;
  var allowLeadingOf = (
    document.getElementById('allow-leading-of') as HTMLInputElement
  ).checked;
  document.getElementById('results')!.innerHTML = JSON.stringify(
    parseIngredient(
      (document.getElementById('ingredient-list') as HTMLInputElement).value,
      {
        normalizeUOM: normalizeUOM,
        allowLeadingOf: allowLeadingOf,
      }
    ),
    null,
    2
  );
  hljs.highlightBlock(document.getElementById('results'));
});
