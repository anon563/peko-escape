const CARROT_ITEM = {
    id: 0,
    setEffect: unit => {
        unit.maxHealth += 3;
        unit.health += 3;
    },
    removeEffect: unit => {
        unit.maxHealth -= 3;
        unit.health = Math.max(1, unit.health - 3);
    }
}