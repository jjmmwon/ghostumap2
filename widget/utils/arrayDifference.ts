export const arrayDifference = (currentArray: any[], newArray: any[]) => {
  const enteredElements = newArray.filter(
    (element) => !currentArray.includes(element)
  );
  const exitedElements = currentArray.filter(
    (element) => !newArray.includes(element)
  );

  return [enteredElements, exitedElements];
};
