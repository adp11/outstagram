import { differenceInMinutes } from "date-fns";

const YEAR_IN_MIN = 1440 * 365;
const MONTH_IN_MIN = 1440 * 30;
const WEEK_IN_MIN = 1440 * 7;
const DAY_IN_MIN = 1440;
const HOUR_IN_MIN = 60;

function computeHowLongAgo(mongoTime, abbreviation = true) {
  const unixTime = Math.floor(new Date(mongoTime).getTime() / 1000);
  const diff = differenceInMinutes(new Date(), new Date(unixTime * 1000));
  let result = Math.floor(diff / YEAR_IN_MIN);
  if (result < 1) {
    result = Math.floor(diff / MONTH_IN_MIN);
    if (result < 1) {
      result = Math.floor(diff / WEEK_IN_MIN);
      if (result < 1) {
        result = Math.floor(diff / DAY_IN_MIN);
        if (result < 1) {
          result = Math.floor(diff / HOUR_IN_MIN);
          if (result < 1) {
            result = diff;
            if (result < 1) {
              return (abbreviation ? "just now" : "JUST NOW");
            }
            return (abbreviation ? `${result}m` : result > 1 ? `${result} MINUTES AGO` : `${result} MINUTE AGO`);
          }
          return (abbreviation ? `${result}h` : result > 1 ? `${result} HOURS AGO` : `${result} HOUR AGO`);
        }
        return (abbreviation ? `${result}d` : result > 1 ? `${result} DAYS AGO` : `${result} DAY AGO`);
      }
      return (abbreviation ? `${result}w` : result > 1 ? `${result} WEEKS AGO` : `${result} WEEK AGO`);
    }
    return (abbreviation ? `${result}m` : result > 1 ? `${result} MONTHS AGO` : `${result} MONTH AGO`);
  }
  return (abbreviation ? `${result}y` : result > 1 ? `${result} YEARS AGO` : `${result} YEAR AGO`);
}

// find the location to insert a key into a sorted descending list
function binarySearch(arr, key, start, end, field) {
  if (start > end) return start;

  const mid = Math.floor((start + end) / 2);
  if (arr[mid][field].seconds === key[field].seconds) return mid;
  if (arr[mid][field].seconds > key[field].seconds) return binarySearch(arr, key, mid + 1, end, field);
  return binarySearch(arr, key, start, mid - 1, field);
}

// quick sort
function partition(array, left, right) {
  const mongoTime = array[(left + right) >>> 1].updatedAt;
  const pivot = Math.floor(new Date(mongoTime).getTime() / 1000);
  while (left <= right) {
    while (Math.floor(new Date(array[left].updatedAt).getTime() / 1000) > pivot) { left++; }
    while (Math.floor(new Date(array[right].updatedAt).getTime() / 1000) < pivot) { right--; }
    if (left <= right) {
      const temp = array[left];
      array[left++] = array[right];
      array[right--] = temp;
    }
  }
  return left;
}

function quickSortHelper(array, left, right) {
  const mid = partition(array, left, right);
  if (left < mid - 1) {
    quickSortHelper(array, left, mid - 1);
  }
  if (right > mid) {
    quickSortHelper(array, mid, right);
  }
}

function quickSort(items) {
  if (items.length === 0 || items.length === 1) {
    return items;
  }
  quickSortHelper(items, 0, items.length - 1);
  return items;
}

export {
  computeHowLongAgo, quickSort,
};
