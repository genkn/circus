const getHorizontalPositionInElement = (parent, clientX) => {
  const {
    left: parentLeft,
    width: parentWidth
  } = parent.getBoundingClientRect();
  let pos = (clientX - parentLeft) / parentWidth;
  if (clientX < parentLeft) pos = 0;
  if (clientX > parentLeft + parentWidth) pos = 1;
  return pos;
};

export default getHorizontalPositionInElement;
