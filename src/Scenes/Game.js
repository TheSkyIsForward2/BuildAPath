class Game extends Phaser.Scene {
    constructor() {
        super("Game");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}};

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];   
        // do the same for lives and enemies
        this.my.sprite.lives = [];
        this.my.sprite.enemyShip = [];
        this.my.sprite.asteroid = [];
        this.my.astMove = [];

        this.maxBullets = 2;           // Don't create more than this many bullets
        
    }

    preload() {
        this.load.setPath("./assets/");

        // For animation
        this.load.image("whitePuff00", "whitePuff00.png");
        this.load.image("whitePuff01", "whitePuff01.png");
        this.load.image("whitePuff02", "whitePuff02.png");
        this.load.image("whitePuff03", "whitePuff03.png");

        // Load the sprite sheet
        this.load.atlasXML("spaceship", "sheet.png", "sheet.xml");

        //load background
        this.load.image("background", "darkPurple.png");

        // Load the Kenny Rocket Square bitmap font
        // This was converted from TrueType format into Phaser bitmap
        // format using the BMFont tool.
        // BMFont: https://www.angelcode.com/products/bmfont/
        // Tutorial: https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

    }

    create() {

        this.init_game();
    
    }

    update() {
        let my = this.my;
        
        // make sure game state is appropriate
        if(!my.gameOver && !my.nextWave){

        // Moving left
        if (this.left.isDown) {
            // Check to make sure the sprite can actually move left
            if (my.sprite.ship.x > (my.sprite.ship.displayWidth/2)) {
                my.sprite.ship.x -= this.playerSpeed;
            }
        }

        // Moving right
        if (this.right.isDown) {
            // Check to make sure the sprite can actually move right
            if (my.sprite.ship.x < (game.config.width - 200 - (my.sprite.ship.displayWidth/2))) {
                my.sprite.ship.x += this.playerSpeed;
            }
        }

        // Check for bullet being fired
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            // Are we under our bullet quota?
            if (my.sprite.bullet.length < this.maxBullets) {
                my.sprite.bullet.push(this.add.sprite(
                    my.sprite.ship.x, my.sprite.ship.y-(my.sprite.ship.displayHeight/2), "spaceship", "laserRed01.png")
                );
            }
        }

        // Remove all of the bullets which are offscreen
        // filter() goes through all of the elements of the array, and
        // only returns those which **pass** the provided test (conditional)
        // In this case, the condition is: is the y value of the bullet
        // greater than zero minus half the display height of the bullet? 
        // (i.e., is the bullet fully offscreen to the top?)
        // We store the array returned from filter() back into the bullet
        // array, overwriting it. 
        // This does have the impact of re-creating the bullet array on every 
        // update() call. 
        my.sprite.bullet = my.sprite.bullet.filter((bullet) => bullet.y > -(bullet.displayHeight/2));
        my.sprite.enemyShip = my.sprite.enemyShip.filter((ship) => ship.x > -(ship.displayWidth/2));
        my.sprite.asteroid = my.sprite.asteroid.filter((asteroid) => asteroid.x > -(asteroid.displayWidth/2));

        // Check for collision with the enemy
        for (let bullet of my.sprite.bullet) {
            for(let ship of my.sprite.enemyShip){
                if (this.collides(ship, bullet)) {
                    // start animation
                    this.puff = this.add.sprite(ship.x, ship.y, "whitePuff03").setScale(0.25).play("puff");
                    // clear out bullet -- put y offscreen, will get reaped next update
                    bullet.y = -100;
                    ship.visible = false;
                    ship.x = -1000;
                    // Update score
                    window.score += my.sScore;
                    this.updateScore();
                }
            }
        }

        // Check for collision with the enemy
        for (let bullet of my.sprite.bullet) {
            for(let asteroid of my.sprite.asteroid){
                if (this.collides(asteroid, bullet)) {
                    // start animation
                    this.puff = this.add.sprite(asteroid.x, asteroid.y, "whitePuff03").setScale(0.25).play("puff");
                    // clear out bullet -- put y offscreen, will get reaped next update
                    bullet.y = -100;
                    asteroid.visible = false;
                    asteroid.x = -1000;
                    // Update score
                    window.score += my.aScore;
                    this.updateScore();
                }
            }
        }

        // check collision with player
        for(let asteroid of my.sprite.asteroid){
            if (this.collides(asteroid, my.sprite.ship)) {
                console.log(asteroid.x+ ", " + asteroid.y);
                this.onDeath();
            }
        }
        for(let ship of my.sprite.enemyShip){
            if (this.collides(ship, my.sprite.ship)) {
                console.log(ship.x+ ", " + ship.y);
                this.onDeath();
            }
        }

        // Make all of the bullets move
        for (let bullet of my.sprite.bullet) {
            bullet.y -= this.bulletSpeed;
        }

        // Make all enemies move
        for(let ship of my.sprite.enemyShip){
            if(ship.y > 1100){
                ship.y = -100;
                ship.x = Math.random()*700 + 50;
            }
            ship.y += 5+(1.5*wave);
        }

        let x = 0;
        for(let asteroid of my.sprite.asteroid){
            if(asteroid.y > 1100){
                asteroid.y = -100;
                asteroid.x = Math.random()*700 + 50;
            }
            if (asteroid.x > (game.config.width - 200 - (asteroid.displayWidth/2)) || asteroid.x < (asteroid.displayWidth/2)) {
                my.astMove[x] = -my.astMove[x];
            }
            asteroid.x += my.astMove[x];
            asteroid.y += 4+wave;
            x++;
        }

        if(my.sprite.asteroid.length == 0 && my.sprite.enemyShip == 0){
            this.waveEnd();
        }

        // game over check
        if(my.sprite.lives.length == 0){
            this.gameOver();
        }
    }

    if(my.gameOver){
        if(Phaser.Input.Keyboard.JustDown(this.restart)){
            wave = 0;
            lives = 3;
            score = 0;
            my.text.score.visible = true;
            my.text.gameover.visible = false;
            my.gameOver = false;
            this.nextWave();
            return;
        }
    }

    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score\n" + window.score);
        my.text.gameover = this.add.bitmapText(300, 400, "rocketSquare", "Your Score Was: " + window.score + "\nPress r to restart");
        my.text.gameover.visible = false;
    }

    waveEnd(){
        let my = this.my; 

        my.nextWave = true;

        // increase score based on wave
        window.score += 10000 * window.wave;
        this.updateScore();

        // tick up lives
        window.lives += 1;
        this.setLives();

        // clean asteroid movement
        my.astMove.splice(0);

        // call next wave
        this.nextWave();
    }

    nextWave(){
        let my = this.my;

        // tick up wave
        window.wave += 1;
        console.log("wave up");

        // create enemies
        for (let x = 0; x < wave * 6; x++){
            my.sprite.enemyShip.push(this.add.sprite(
                Math.random()*700 + 50, -Math.random()*1000, "spaceship", "enemyGreen1.png")
            );
        }
        for (let x = 0; x < wave * 2; x++){
            my.sprite.asteroid.push(this.add.sprite(
                Math.random()*700 + 50, -Math.random()*1000, "spaceship", "meteorBrown_big1.png")
            );
            my.astMove.push(2);
        }

        // set scoring
        my.sScore = 100 * wave;
        my.aScore = 1000 * wave;

        // set lives
        this.setLives();

        // set score
        this.updateScore();
        
        // resume input
        my.nextWave = false;
    }

    onDeath(){

        let my = this.my;

        window.lives -= 1;
        this.setLives();

        // set current enemies back up
        for(let ship of my.sprite.enemyShip){
                ship.y = -(Math.random() * 1000);
                ship.x = Math.random()*700 + 50;
            }

        for(let asteroid of my.sprite.asteroid){
                asteroid.y = -(Math.random() * 1000);
                asteroid.x = Math.random()*700 + 50;
            }
        
    }

    setLives(){
        let my = this.my;

        for(let life of my.sprite.lives){
            life.visible = false;
        }
        my.sprite.lives.splice(0);

        // Put lives on screen and then scale
        for (let x = 1; x<=window.lives; x++) {
            my.sprite.lives.push(this.add.sprite(
                900, 125+(x*45), "spaceship", "playerShip1_red.png").setScale(0.5)
            );
        }
    }

    gameOver(){
        let my = this.my;

        // game over state
        my.gameOver = true;

        // clean arrays
        if(my.sprite.bullet.length>0){
            for(let x of my.sprite.bullet){
                x.visible = false;
            }
            my.sprite.bullet.splice(0);
        }
        if(my.sprite.asteroid.length>0){
            for(let x of my.sprite.asteroid){
                x.visible = false;
            }
            my.sprite.asteroid.splice(0);
        }
        if(my.sprite.enemyShip.length>0){
            for(let x of my.sprite.enemyShip){
                x.visible = false;
            }
            my.sprite.enemyShip.splice(0);
        }
        if(my.astMove.length>0)
            my.astMove.splice(0);

        //reset player position
        my.sprite.ship.x = 400;
        my.sprite.ship.y = 750;

        // Put score on screen
        my.text.gameover.visible = true;
        my.text.score.visible = false;
    }

    init_game(){
        let my = this.my;   // create an alias to this.my for readability

        my.sprite.background = this.add.sprite(500, 400, "background");
        my.sprite.background.setScale(4);

        // set game over state
        my.gameOver = false;

        // Create white puff animation
        this.anims.create({
            key: "puff",
            frames: [
                { key: "whitePuff00" },
                { key: "whitePuff01" },
                { key: "whitePuff02" },
                { key: "whitePuff03" },
            ],
            frameRate: 20,    // Note: case sensitive (thank you Ivy!)
            repeat: 5,
            hideOnComplete: true
        });

        // Create the player sprite
        this.playerX = 400;
        this.playerY = 750;

        // create player
        my.sprite.ship = this.add.sprite(this.playerX, this.playerY, "spaceship", "playerShip1_red.png");
        
        // SCALE SPRITES = my.sprite.elephant.setScale(0.25);

        // Create key objects
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.restart = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set movement speeds (in pixels/tick)
        this.playerSpeed = 10;
        this.bulletSpeed = 25;

        // Put score on screen
        my.text.score = this.add.bitmapText(750, 0, "rocketSquare", "Score:\n" + window.score);
        my.text.lives = this.add.bitmapText(840, 100, "rocketSquare", "Lives");
        // game over score
        my.text.gameover = this.add.bitmapText(300, 400, "rocketSquare", "Your Score Was: " + window.score + "\nPress r to restart");
        my.text.gameover.visible = false;

        // update HTML description
        document.getElementById('description').innerHTML = '<h2>We_Invaders.js</h2><br>A: left // D: right // Space: fire/emit'

        this.nextWave();

    }

}
         