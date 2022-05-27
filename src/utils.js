import { differenceInMinutes } from "date-fns";

const YEAR_IN_MIN = 1440 * 365;
const MONTH_IN_MIN = 1440 * 30;
const WEEK_IN_MIN = 1440 * 7;
const DAY_IN_MIN = 1440;
const HOUR_IN_MIN = 60;

function capitalizeFirebaseAuthError(message) {
  const words = message.split("-");
  words[0] = words[0].substring(words[0].indexOf("/") + 1);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function computeHowLongAgo(unixTime, abbreviation = true) {
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
function binarySearch(arr, key, start, end) {
  if (start > end) return start;

  const mid = Math.floor((start + end) / 2);
  if (arr[mid].creationTime.seconds === key.creationTime.seconds) return mid;
  if (arr[mid].creationTime.seconds > key.creationTime.seconds) return binarySearch(arr, key, mid + 1, end);
  return binarySearch(arr, key, start, mid - 1);
}

function insert(arr, element) {
  if (arr.length === 0) {
    arr.push(element);
  } else {
    const pos = binarySearch(arr, element, 0, arr.length - 1);
    arr.splice(pos, 0, element);
  }
}

export {
  capitalizeFirebaseAuthError, insert, computeHowLongAgo,
};
