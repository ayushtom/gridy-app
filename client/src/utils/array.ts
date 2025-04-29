export function addAndRemoveCommon(arr1: number[], arr2: number[]) {
  // Combine the two arrays
  const combinedArray = arr1.concat(arr2);

  // Filter out duplicates, but keep at least one instance of each element
  const uniqueArray = combinedArray.filter(
    (item, index) => combinedArray.indexOf(item) === index
  );

  return uniqueArray;
}
