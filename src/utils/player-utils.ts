export class PlayerUtils {
  public static getRandomName(): string {
    const name = [
      "cat",
      "dog",
      "elephant",
      "giraffe",
      "hippopotamus",
      "kangaroo",
      "koala",
      "lion",
      "monkey",
      "panda",
      "penguin",
      "pig",
      "rabbit",
      "rhinoceros",
      "squirrel",
      "tiger",
      "zebra",
    ];

    let animal = name[Math.floor(Math.random() * name.length)];
    // uppercase first letter
    animal = animal.charAt(0).toUpperCase() + animal.slice(1);
    // append two random numbers
    animal += Math.floor(Math.random() * 10);
    animal += Math.floor(Math.random() * 10);

    return animal;
  }

  public static getColorByPingTime(_ping: number): string {
    // TODO: implement logic to return color based on ping time
    return "white";
  }
}
