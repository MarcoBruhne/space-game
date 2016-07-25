var minObstacleDistance = 100;
var maxAsteroidSize = 30;
var guardingRadius = 50;
var minDistanceToPlayer = 10;
var maxShipAngle = 70 * (Math.PI / 360);

var asteroids, enemies, enemy, asteroid, playerPosition,
    radius, i, bezierPoints;

// Enemyklasse
function Enemy(location, speed ,weapon) {
    this.speed = speed;
    this.location = location;
    this.weapon = weapon;
    this.isAlive = true;
    this.shootAble = false;
    this.onBezier = false;
}

Enemy.prototype.move = function(delta, asteroids, enemies) {
    var avoidDir, avoidDirs, collisions, d, distanceToShip, collision;
    var onPlayerAttack = false;

    // 0. Schritt: Checke ob auf Bezierkurve oder nicht
    if(onPlayerAttack) {
        // Achte darauf, dass sich der Spieler nicht um mehr als 90° zur
        // urspruenglichen Richtung gedreht hat
        optimalDir = this.moveBezier();
    } else {

        // 1. Schritt: Gehe in Richtung Spieler (Idealrichtung)
        var directionToPlayer = MATH.clone(playerPosition);
        directionToPlayer.sub(this.location);

        var distanceToNext = directionToPlayer.length();

        directionToPlayer.normalize();

        // TODO: Fuer Bezier Wechsel auf optimalDir
        var optimalDir = MATH.clone(directionToPlayer);

        // 2. Schritt: Ueberpruefe, ob dem Spieler zu nahe geraten
        if(distanceToNext < minDistanceToPlayer){
            // Gelange hinter dem Spieler:
            // fliege in Bezierkurve hinter den Flieger
            // setze Idealrichtung als Richtung zu naechstem Punkt auf der Kurve
            // berechne Bezierkurve und setze flag onBezier = true
            onBezier = true;
        }
    }

    // 3. Schritt: Ueberpruefe auf Hindernisse
    var obstacles = [];

    // Setze, da Abstand nach vorne wichtiger, Schiff voruebergehend auf die
    // Position mit idealer Flugrichtung im naechsten Frame
    var shipPosition = MATH.clone(this.position);
    optimalDir.multiplyScalar(delta*this.speed);
    shipPosition.add(optimalDir);
    optimalDir.normalize();

    var shipDistance = distanceToNext + delta * this.speed;

    // Kontrolliere, ob sich im guardingRadius andere Gegenstaende befinden
    for(asteroid of asteroids) { // Asteroiden schon geupdatet
        d = Math.abs(shipDistance - asteroid.location.distance(playerPosition));

        // Teste, ob im richtigen Ring um den Spieler
        // possibleObstacle um die Sortierung zu nutzen -> Doppelter switch
        if(d <= minObstacleDistance) { // nahe (in Bezug auf Distanz zum Player)
            possibleObstacle = true;
            distanceToShip = asteroid.position.distanceTo(shipPosition);
            if(distanceToShip <= guardingRadius) { // nahe an this
                obstacles.push(asteroid);
            }
        } else if(possibleObstacle && d > minObstacleDistance) {
            possibleObstacle = false;
            break; // da sortiert nun nur noch weiterliegende Objekte
        }

    }

    for(enemy of enemies) {
        d =  enemy.location.distanceTo(playerPosition) - shipDistance;
        if(d <= 0 && d <= minObstacleDistance) { // nahe und vor einem
            distanceToShip = enemy.position.distanceTo(shipPosition);
            if(distanceToShip <= guardingRadius) { // nahe an this
                obstacles.push(enemy);
            }
        } else if(possibleObstacle && d > minObstacleDistance) {
            possibleObstacle = false;
            break;
        }

    }


    // 4. Schritt: ausweichen
    // naechstgelegenem Hindernis ausweichen, bis auf Weg kein Gegenstand

    if(obstacles.length > 0) {
        // Unterscheide nach Faellen, da der Algorithmus fuer mehrere
        // Hindernisse rechenintensiv ist (rendert die Szene neu)

        // einfacher Fall: nur ein Hindernis
        if(obstacles.length == 1) {
            var flightAngle =
                Math.dot(obstacles[0].direction.normalize(),this.direction);

            // Falls nicht auf einen zufliegend
            if(flightAngle >= -0.965) { // im 15° Winkel auf einen zufliegend
                // Weiche aus: Gehe in die optimale Richtung, abgelenkt um
                //  Normale zum Schnittpunkt mit Hindernis
                var avoidDir = new THREE.Vector3(0,0,0);
                // TODO: weiche aus in Richtung der Normalen des Schnittpunkts
                // a) Berechne Schnittpunkt(e) mit Obstacle
                // b) Falls mehr als ein (zwei) Schnittpunkt, nimm das naehere
                // -> t kleiner waehlen -> - statt + in Formel
                var dirToObstacle = new THREE.Vector3(
                    obstacles[0].location.x - this.location.x,
                    obstacles[0].location.y - this.location.y,
                    obstacles[0].location.z - this.location.z);
                var a = dirToObstacle.x * dirToObstacle.x +
                        dirToObstacle.y * dirToObstacle.y +
                        dirToObstacle.z * dirToObstacle.z;
                // c) Normale ist Schnittpunkt.sub(obstacle.location)
                // d) .normalize()

                // TODO: rotiere avoidDir um bis zu +-10° bzgl. jeder Richtung
                //          sowie in createAsteroid()

                // Gewichte die Laengen, um Kollision zu vermeiden
                var bestImpact = this.position.distanceTo(obstacles[0].location);
                var avoidImpact = 1.5 * maxAsteroidSize;

                avoidDir.multiplyScalar(avoidImpact);

                direction = MATH.clone(directionToPlayer);
                direction.multiplyScalar(bestImpact);

                direction.add(avoidDir);

            } else {
            // sonst, weiche aus bzw. zerschiesse Asteroid wie aufs Zettel 1
            }
        } else {
            directionFound = false;

            // Konstruiere Richtungsplane
            var upVector = new THREE.Vector3(0,1,0);
            //upVector.add(shipPosition);
            // TODO: Ueberpruefe, ob Up richtig
            var N = MATH.clone(optimalDir);

            var U = MATH.clone(N);
            U.cross(N);
            U.cross(N);

            var V = MATH.clone(N);
            V.cross(U);

            N.normalize();
            U.normalize();
            V.normalize();


            // 4.1 Suche bis zu fuenf Iterationen lang eine neue Richtung

            // 4.1.1 trivialer Versuch -> geht optimale Richtung?
            directionFound = checkDirection(direction, obstacles);

            if(directionFound) {
                direction = optimalDir;
                // Falls bevorzugte Richtung geht, gehe in diese Richtung
                // mit einem kleinen vom "Fehler" abhaengigen Unterschied
                direction = new THREE.Vector3(
                                Math.random(), Math.random(), Math.random());
                direction.addScalar(directionError);
                direction.add(optimalDir.multiplyScalar(distanceToNext));
            } else {
                // 4.1.2 wenn nicht, ueberpruefe schrittweise Umgebungs
                // 4.1.3 alles in Umgebung (gleicher Abstand)
                var scalar = this.speed * delta * Math.tan(maxShipAngle);
                var checkingDistance =  0.2 * scalar; // s. Zettel 3

                // setze die Laengen von U und V neu, auf maximale Distanz
                // (je nach Winkel des Raumschiffs)
                U.multiplyScalar(checkingDistance);
                V.multiplyScalar(checkingDistance);

                for(i = 0; i < 4; i++) {
                    avoidDir = MATH.clone(direction);
                    switch(i) {
                        case 0: avoidDir = avoidDir.add(U).add(V); break;
                        case 1: avoidDir = avoidDir.add(U).sub(V); break;
                        case 2: avoidDir = avoidDir.sub(U).add(V); break;
                        case 3: avoidDir = avoidDir.sub(U).sub(V); break;
                        default: avoidDir = optimalDir;
                    }

                    avoidDirs.push(avoidDir);
                    collisions[i] = checkDirection(avoidDir, obstacles);
                    directionFound = (collisions[i] == 0);

                    if(directionFound) {
                        direction = avoidDir;
                        break;
                    }
                }

                var iter = 0;
                do {
                    // 4.1.4a Bestimme Richtung mit minimaler Kollisionsanzahl
                    if(!directionFound) {
                        direction = avoidDirs[MATH.getMinIndex(collisions)];
                    }

                    // setze die Laengen von U und V neu, auf maximale Distanz
                    // (je nach Winkel des Raumschiffs)
                    U.normalize();
                    V.normalize();
                    U.multiplyScalar(2/3*checkingDistance*scalar);
                    V.multiplyScalar(2/3*checkingDistance*scalar);

                    // 4.1.4b Betrachte die Eckpunkte (Abstand ungleich) in der Umgebung
                    for(i = 0; i < 4; i++) {
                        avoidDir = MATH.clone(direction);
                        switch(i) {
                            case 0: avoidDir = avoidDir.add(U).add(V); break;
                            case 1: avoidDir = avoidDir.add(U).sub(V); break;
                            case 2: avoidDir = avoidDir.sub(U).add(V); break;
                            case 3: avoidDir = avoidDir.sub(U).sub(V); break;
                            default: avoidDir = optimalDir;
                        }

                        collisions[i] = checkDirection(avoidDir, obstacles);
                        directionFound = (collisions[i] == 0);

                        if(directionFound) {
                            direction = avoidDir;
                        }
                    }

                    if(directionFound) {
                        // 4.1.4c Mach eine weitere Iteration zum Pruefen

                        // setze die Laengen von U und V neu, auf maximale Distanz
                        U.normalize();
                        V.normalize();
                        U.multiplyScalar(2/3 * checkingDistance * scalar);
                        V.multiplyScalar(2/3 * checkingDistance * scalar);

                        for(i = 0; i < 4; i++) {
                            avoidDir = MATH.clone(direction);
                            switch(i) {
                                case 0: avoidDir = avoidDir.add(U).add(V); break;
                                case 1: avoidDir = avoidDir.add(U).sub(V); break;
                                case 2: avoidDir = avoidDir.sub(U).add(V); break;
                                case 3: avoidDir = avoidDir.sub(U).sub(V); break;
                                default: avoidDir = optimalDir;
                            }

                            collisions[i] = checkDirection(avoidDir, obstacles);
                            if(collisions[i] != 0) {
                                // Falls Kollision -> weiter iterieren
                                directionFound = false;
                                break;
                            }
                        }
                    }

                    // Automatisch erfuellt
                    // Falls immer noch keine Kollision, nimm die vorherige

                    // Falls doch und Iterationsanzahl erreicht
                    //    -> nimm letzte gute und schiesse
                    iter++;
                } while(!directionFound && iter <= 5);
            }


            if(!directionFound){
                    // sonst rate bis zu fuenfmal Richtung
                    U.normalize();
                    V.normalize();

                    for(i = 0; i < 5; i++) {
                        // "rate" neue Richtung
                        avoidDir = MATH.clone(U);
                        U.addScalar(2*Math.random() - 1);
                        V.addScalar(2*Math.random() - 1);
                        avoidDir.add(V);
                        V.normalize();
                        avoidDir.normalize();
                        // Strecke, bleibe aber im Bereich
                        avoidDir.addScalar(Math.random() * distanceToNext);

                        direction = MATH.clone(optimalDir);
                        direction.add(avoidDir);

                        //  teste, ob diese geht
                        collision = checkDirection(direction, obstacles);
                        directionFound = (collision == 0);

                        if(directionFound) {
                                // falls ja, nimm diese
                            directionFound = true;
                            break;
                        }
                    }





                if(!directionFound) {
                    // Falls dies auch nicht geht, pruefe, ob Ecken der Plane frei

                    // Setze die Laengen von U und V neu, auf maximale Distanz
                    // (je nach Winkel des Raumschiffs)
                    U.normalize();
                    V.normalize();
                    U.multiplyScalar(scalar);
                    V.multiplyScalar(scalar);

                    i = 0;
                    while(!directionFound) {

                        direction = MATH.clone(optimalDir);

                        switch(i) {
                            case 0:
                                direction = direction.add(U).add(V);
                                break;
                            case 1:
                                direction = direction.add(U).sub(V);
                                break;
                            case 2:
                                direction = direction.sub(U).add(V);
                                break;
                            case 3:
                                direction = direction.sub(U).sub(V);
                                break;
                            default: direction = optimalDir;
                        }



                        collision = checkDirection(direction, obstacles);
                        directionFound = (collision == 0);
                        i++;
                    }

                    // TODO: Falls dies auch nicht geht, gehe orthogonal
                    // Raycaster in v x e1, v x e2, v x e3 -> falls nichts getroffen -> hierhin
                    // nur in diese Richtung nicht linearkominiert

                    if(!directionFound) {
                        // Falls vor einem alles versperrt, bleibe stehen und schiesse
                        direction = new THREE.Vector3(0,0,0);
                        this.shoot();
                    }
                }
            }
        }

    } else {
        direction = directionToPlayer;
        shootAble = true;
    }

    // 5. Schritt: normalisiere, um Geschwindigkeit nur von speed
    //                              abhaengig zu machen
    direction.normalize();

    // 6. Schritt:
    this.location.add(direction.multiplyScalar(delta * this.speed);
}

// @return optimale Richtung nach Bezierflugbahn
Enemy.prototype.moveBezier = function() {
    return new THREE.Vector3(0,0,0);
}

// Ueberprueft die Richtung auf Hindernisse
// @return {true,false} Richtung hindernisfrei?
Enemy.prototype.checkDirection = function(direction, objects) {

}


Enemy.prototype.shoot = function() {
    // Schießt von location mit weapon in direction
    // TODO: Je naeher desto haeufiger
}

Enemy.prototype.shot = function() {
    // TODO: Fuer jeden Schuss im Spiel und jeden Gegenstand in der Naehe
    // ueberpruefe Kollision
    return false;
}

Enemy.prototype.onCollisionDetect = function(other) {
    // use other instanceof whatever
}


// Asteroidenklasse

function Asteroid(location,radius, direction, speed) {
    this.direction = speed * direction.normalize();
    this.radius = radius;
    this.location = location;
}

Asteroid.prototype.move = function(delta, asteroids, enemies) {
    this.location.add(direction.multiplyScalar(delta));;
}

Asteroid.prototype.onCollisionDetect(other) {
    // TODO: aufspalten in Dreiecke mit reflektiertem Winkel
}
