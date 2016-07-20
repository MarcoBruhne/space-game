// The collision has to be initialized with an array containing all objects/meshes
// that should be able to collide/intersect with another object/mesh. If there is
// a collision the mesh turns red.

function Collision(_collidableMeshList) {

    // Contains all Meshes that can collide
    var collidableMeshList = _collidableMeshList;


    // Calculates the min x value of the vertices of a box
    function minX(box) {
        // array for x values
        var globalXs = [];
        // get the position of each vertex
        for (var vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++)
            {
                // get the local position of the vertex
                var localVertex = box.geometry.vertices[vertexIndex].clone();
                // transform it into the global position
                var globalVertex = localVertex.applyMatrix4( box.matrix );
                // save x value
                globalXs.push(globalVertex.x);
            }
        // return the min
        return Math.min.apply(Math, globalXs);
    }

    // Calculates the max X value of the vertices of a box
    function maxX(box) {
        var globalXs = [];
        for (var vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++)
            {
                var localVertex = box.geometry.vertices[vertexIndex].clone();
                var globalVertex = localVertex.applyMatrix4( box.matrix );
                globalXs.push(globalVertex.x);
            }
        return Math.max.apply(Math, globalXs);
    }

    // Calculates the min Y value of the vertices of a box
    function minY(box) {
        var globalYs = [];
        for (var vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++)
            {
                var localVertex = box.geometry.vertices[vertexIndex].clone();
                var globalVertex = localVertex.applyMatrix4( box.matrix );
                globalYs.push(globalVertex.y);
            }
        return Math.min.apply(Math, globalYs);
    }

    // Calculates the max Y value of the vertices of a box
    function maxY(box) {
        var globalYs = [];
        for (var vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++)
            {
                var localVertex = box.geometry.vertices[vertexIndex].clone();
                var globalVertex = localVertex.applyMatrix4( box.matrix );
                globalYs.push(globalVertex.y);
            }
        return Math.max.apply(Math, globalYs);
    }

    // Calculates the min Z value of the vertices of a box
    function minZ(box) {
        var globalZs = [];
        for (var vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++)
            {
                var localVertex = box.geometry.vertices[vertexIndex].clone();
                var globalVertex = localVertex.applyMatrix4( box.matrix );
                globalZs.push(globalVertex.z);
            }
        return Math.min.apply(Math, globalZs);
    }

    // Calculates the max Z value of the vertices of a box
    function maxZ(box) {
        var globalZs = [];
        for (var vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++)
            {
                var localVertex = box.geometry.vertices[vertexIndex].clone();
                var globalVertex = localVertex.applyMatrix4( box.matrix );
                globalZs.push(globalVertex.z);
            }
        return Math.max.apply(Math, globalZs);
    }

    // Checks if there is an intersection between two boxes
    function intersectBoxBox(a,b) {
        if (minX(a) <= maxX(b) && maxX(a) >= minX(b) &&
            (minY(a) <= maxY(b) && maxY(a) >= minY(b)) &&
            (minZ(a) <= maxZ(b) && maxZ(a) >= minZ(b)))
        {
            console.log("Collision");
            collisionSuccess(a);
            collisionSuccess(b);
        }
        // if there is an intersection in every dimension the two boxes intersect
        return (minX(a) <= maxX(b) && maxX(a) >= minX(b) &&
            (minY(a) <= maxY(b) && maxY(a) >= minY(b)) &&
            (minZ(a) <= maxZ(b) && maxZ(a) >= minZ(b)))
    }

    // Checks if there is an intersection between two spheres
    function intersectSphereOther(sphere, other) {
        // distance between the center of the spheres
        var distance = Math.sqrt((sphere.position.x - other.position.x) *
                (sphere.position.x - other.position.x) +
                (sphere.position.y - other.position.y) * (sphere.position.y - other.position.y) +
                (sphere.position.z - other.position.z) * (sphere.position.z - other.position.z));

        if (distance < (sphere.geometry.parameters.radius + other.geometry.parameters.radius)) {
            console.log("Collision");
            collisionSuccess(sphere);
            collisionSuccess(other);
        }
        // if the distance between the centers is smaller the the sum of the
        // radii the spheres intersect
        return distance < (sphere.geometry.parameters.radius + other.geometry.parameters.radius);
    }

    // Checks if there is an intersection between  a sphere and a box
    function intersectSphereBox(sphere, box) {
        // get box closest point to sphere center by clamping
        var x = Math.max(minX(box), Math.min(sphere.position.x, maxX(box)));
        var y = Math.max(minY(box), Math.min(sphere.position.y, maxY(box)));
        var z = Math.max(minZ(box), Math.min(sphere.position.z, maxZ(box)));

        // distance between the sphere and the closest box-point to the spehere
        var distance = Math.sqrt((x - sphere.position.x) * (x - sphere.position.x) +
                           (y - sphere.position.y) * (y - sphere.position.y) +
                           (z - sphere.position.z) * (z - sphere.position.z));

        // console.log(distance);

        if(distance < sphere.geometry.parameters.radius) {
            console.log("Collision");
            collisionSuccess(sphere);
            collisionSuccess(box);
        }
        // if the distance is smaller than the radius of the sphere there is an intersection
        return distance < sphere.geometry.parameters.radius;
    }


    function collisionSuccess(mesh){
        var MaterialHit = new THREE.MeshBasicMaterial({ color:0xFF0000 });
        mesh.material = MaterialHit;
    }



    return {
        // returns whether there is an intersection between two boxes
        intersectBoxBox: intersectBoxBox,
        // returns whether there is an intersection between two spheres
        intersectSphereOther: intersectSphereOther,
        // returns whether there is an intersection between a sphere and a box
        intersectSphereBox: intersectSphereBox,

        // checks all possible collisions
        collisionWithHitbox: function() {

            for (var i = 0; i <= collidableMeshList.length-2; i++) {
                for (var j = i+1; j <= collidableMeshList.length-1 ; j++) {

                    if (collidableMeshList[i].geometry.type === "BoxGeometry"
                            && collidableMeshList[j].geometry.type === "BoxGeometry") {
                        intersectBoxBox(collidableMeshList[i], collidableMeshList[j]);
                    }
                    else if (collidableMeshList[i].geometry.type === "SphereGeometry"
                            && collidableMeshList[j].geometry.type === "SphereGeometry") {
                        intersectSphereOther(collidableMeshList[i], collidableMeshList[j]);
                    }
                    else if (collidableMeshList[i].geometry.type === "BoxGeometry"
                            && collidableMeshList[j].geometry.type === "SphereGeometry") {
                        intersectSphereBox(collidableMeshList[j], collidableMeshList[i]);
                    }
                    else if (collidableMeshList[i].geometry.type === "SphereGeometry"
                            && collidableMeshList[j].geometry.type === "BoxGeometry") {
                        intersectSphereBox(collidableMeshList[i], collidableMeshList[j]);
                    }

                }
            }
        },

        // returns wheter there is a collision between a spehere and any other mesh
        // that is collidable
        sphereCollision: function(sphere) {
            for (var i = 0; i <= collidableMeshList.length - 1; i++) {
                // to prevent collision with itself
                if(sphere !== collidableMeshList[i]) {
                    // collision with a box
                    if(collidableMeshList[i].geometry.type === "BoxGeometry") {
                        if(intersectSphereBox(sphere, collidableMeshList[i])) {
                            return true;
                        }
                    }
                    // collision with another sphere
                    else if(collidableMeshList[i].geometry.type === "SphereGeometry") {
                        if(intersectSphereOther(sphere, collidableMeshList[i])) {
                            return true;
                        }
                    }

                }
            }
            return false;

        },

        // returns wheter there is a collision between a box and any other mesh
        // that is collidable
        boxCollision: function(box) {
            for (var i = 0; i <= collidableMeshList.length - 1; i++) {
                // to prevent collision with itself
                if (box !== collidableMeshList[i]) {
                    // collision with another box
                    if (collidableMeshList[i].geometry.type === "BoxGeometry") {
                        if (intersectBoxBox(box, collidableMeshList[i])) {
                            return true;
                        }
                    }
                    // collision with a sphere
                    else if(collidableMeshList[i].geometry.type === "SphereGeometry") {
                        if (intersectSphereBox(collidableMeshList[i], box)) {
                            return true;
                        }
                    }

                }
            }

        }


    }


}
