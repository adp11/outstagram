import {
  differenceInMinutes, differenceInHours, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears,
} from "date-fns";
// import differenceInHours from "date-fns/differenceInHours";

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

function locationOf(element, array, start, end) {
  start = start || 0;
  end = end || array.length;
  const pivot = parseInt(start + (end - start) / 2, 10);
  if (end - start <= 1 || array[pivot].creationTime.seconds === element.creationTime.seconds) return pivot;
  if (array[pivot].creationTime.seconds < element.creationTime.seconds) {
    return locationOf(element, array, pivot, end);
  }
  return locationOf(element, array, start, pivot);
}

function insert(element, array) {
  const targetIndex = locationOf(element, array);
  if (targetIndex === 0) {
    array.splice(targetIndex, 0, element);
  } else {
    array.splice(targetIndex + 1, 0, element);
  }
  return array;
}

function computeHowLongAgo(unixTime, abbreviation) {
  let result = differenceInYears(new Date(), new Date(unixTime * 1000) > 0);
  if (result === 0) {
    result = differenceInMonths(new Date(), new Date(unixTime * 1000) > 0);
    if (result === 0) {
      result = differenceInWeeks(new Date(), new Date(unixTime * 1000) > 0);
      if (result === 0) {
        result = differenceInDays(new Date(), new Date(unixTime * 1000) > 0);
        if (result === 0) {
          result = differenceInDays(new Date(), new Date(unixTime * 1000) > 0);
          if (result === 0) {
            result = differenceInHours(new Date(), new Date(unixTime * 1000) > 0);
            if (result === 0) {
              result = differenceInMinutes(new Date(), new Date(unixTime * 1000) > 0);
              if (result === 0) {
                result = "JUST NOW";
              }
            }
          }
        }
      }
    }
  }
}

export { capitalizeFirebaseAuthError, quickSort, insert };
