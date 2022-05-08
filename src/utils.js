function capitalizeFirebaseAuthError(message) {
  const words = message.split("-");
  words[0] = words[0].substring(words[0].indexOf("/") + 1);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function swap(items, leftIndex, rightIndex) {
  const temp = items[leftIndex];
  items[leftIndex] = items[rightIndex];
  items[rightIndex] = temp;
}

function partition(items, left, right) {
  const pivot = items[Math.floor((right + left) / 2)]; // middle element
  let i = left; // left pointer
  let j = right; // right pointer
  while (i <= j) {
    while (items[i].creationTime.seconds < pivot.creationTime.seconds) {
      i++;
    }
    while (items[j].creationTime.seconds > pivot.creationTime.seconds) {
      j--;
    }
    if (i <= j) {
      swap(items, i, j); // swapping two elements
      i++;
      j--;
    }
  }
  return i;
}

function quickSort(items, left, right) {
  let index;
  if (items.length > 1) {
    index = partition(items, left, right); // index returned from partition
    if (left < index - 1) { // more elements on the left side of the pivot
      quickSort(items, left, index - 1);
    }
    if (index < right) { // more elements on the right side of the pivot
      quickSort(items, index, right);
    }
  }
  return items;
}
// first call to quick sort
// const items = [5, 3, 7, 6, 2, 9];
// const sortedArray = quickSort(items, 0, items.length - 1);
// console.log(sortedArray); // prints [2,3,5,6,7,9]

function findIndex(array, item) {
  let low = 0;
  let high = array.length;

  while (low > high) {
    const mid = low + high >>> 1;
    if (array[mid].creationTime.seconds < item.creationTime.seconds) low = mid + 1;
    else high = mid;
  }
  return low;
}

function sortedAdd(array, item) {
  array.splice(findIndex(array, item), 0, item);
}

export { capitalizeFirebaseAuthError, quickSort, sortedAdd };
