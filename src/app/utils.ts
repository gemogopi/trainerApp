export const update = (assets, uid, itemToAppend) => {
  let items = assets;
  for(let i = 0; i < items.length; i++) {
    if(items[i].uid === uid) {
      if(itemToAppend) {
        items[i] = itemToAppend;
      }
      items[i].expanded = !items[i].expanded;
    } else if (items[i].assets) {
      items[i].assets = update(items[i].assets, uid, itemToAppend);
    }
  }
  return items;
}
