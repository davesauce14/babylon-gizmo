import { AbstractMesh, Scene, Color3, Mesh, Vector3, PlaneRotationGizmo,Gizmo, Matrix, Angle } from "babylonjs";
import * as BABYLON from "babylonjs";
import { EnhancedGizmo } from './EnhancedGizmo';


export class EnhancedRotationGizmo extends EnhancedGizmo {


    circleConstants: any = {
        radius: .1,
        pi2: Math.PI * 2,
        tessellation: 60
    }

    constructor(public scene: Scene, private thickness = 0.7, private colliderVisibility = 0) {
        super(scene);
    }

    create(){

        this.gizmoManager.rotationGizmoEnabled = true;
        const gizmo = this.gizmoManager?.gizmos?.rotationGizmo;

        if(gizmo && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {
    
            // Set Custom Mesh X
            const xMesh = this.createRotationMesh(gizmo.xGizmo, this.utilityScene, Color3.Red(), "x", new Vector3(1, 0, 0));
            gizmo.xGizmo.setCustomMesh(xMesh);

            // Set Custom Mesh Y
            const yMesh = this.createRotationMesh(gizmo.yGizmo, this.utilityScene, Color3.Green(), "y", new Vector3(0, 1, 0));
            gizmo.yGizmo.setCustomMesh(yMesh);

            // Set Custom Mesh Z
            const zMesh = this.createRotationMesh(gizmo.zGizmo, this.utilityScene, Color3.Blue(), "z", new Vector3(0, 0, 1))
            gizmo.zGizmo.setCustomMesh(zMesh);

            this.gizmoMouseObservers(this.utilityScene);
        }
    }

    createRotationMesh(gizmo: PlaneRotationGizmo, scene: Scene, color: Color3, axis: string, planeNormal: Vector3, tessellation = 32): any {

        // Parent
        const parentMesh = new AbstractMesh("", this.utilityScene);
    
        // Geometry
        const drag = Mesh.CreateTorus("", 0.6, 0.09 * this.thickness, tessellation, this.utilityScene);
        const rotationMesh = Mesh.CreateTorus("", 0.6, 0.005 * this.thickness, tessellation, this.utilityScene);

        // Material
        const material = this.colorHelper(color, this.utilityScene);
        const hoverMaterial = this.colorHelper(Color3.Yellow(), this.utilityScene);
        const invisibleMaterial = this.colorHelper(Color3.Gray(), this.utilityScene);
        invisibleMaterial.alpha = this.colliderVisibility;

        // Edit Mesh Properties
        rotationMesh.material = material;
        rotationMesh.rotation.x = Math.PI / 2;
        drag.rotation.x = Math.PI / 2;
        drag.visibility = 0;

        parentMesh.addChild(rotationMesh);
        parentMesh.addChild(drag);
        parentMesh.scaling.scaleInPlace(1 / 3);

        // Axis Gizmo Closures
        let dragDistance = 0;
        const rotationCirclePaths: any[] = [];
        const rotationCircle: Mesh = this.setupRotationCircle(rotationCirclePaths, parentMesh);

        parentMesh.lookAt(gizmo._rootMesh.position.add(planeNormal));
        
        const lastDragPosition = new Vector3();
        let dragPlanePoint = new Vector3();

        const rotationMatrix = new Matrix();
        const planeNormalTowardsCamera = new Vector3();
        const localPlaneNormalTowardsCamera = new Vector3();

        gizmo.dragBehavior.onDragStartObservable.add(e => {

            // Rotation Circle Forward Vector
            const forward = new BABYLON.Vector3(0, 0, 1);		
            const direction = rotationCircle.getDirection(forward);
            direction.normalize();

            // Remove Rotation Circle from parent mesh before drag interaction
            parentMesh.removeChild(rotationCircle);
            
            lastDragPosition.copyFrom(e.dragPlanePoint);
            dragPlanePoint = e.dragPlanePoint;
            const origin = rotationCircle.getAbsolutePosition().clone();
            const originalRotationVector = rotationCircle.getAbsolutePosition().clone().addInPlace(direction);
            const dragStartVector = e.dragPlanePoint;
            let angle = this.calculateDragStartAngle(origin, originalRotationVector, dragStartVector);

            if(Vector3.Dot(rotationCircle.up, Vector3.Down()) > 0) {
                angle = -angle;
            }
            rotationCircle.addRotation(0, angle, 0);
            
        })

        gizmo.dragBehavior.onDragObservable.add(e => {

            const angle = this.calculateRotationAngle(gizmo, e, lastDragPosition, planeNormal, planeNormalTowardsCamera, localPlaneNormalTowardsCamera, rotationMatrix);
            dragDistance += angle;

            this.updateRotationCircle(rotationCircle, rotationCirclePaths, dragDistance, dragPlanePoint);
            lastDragPosition.copyFrom(e.dragPlanePoint);
        })

        gizmo.dragBehavior.onDragEndObservable.add(() => {
            dragDistance = 0;
            this.updateRotationCircle(rotationCircle, rotationCirclePaths, dragDistance, dragPlanePoint);
            // Add rotation circle back to parent mesh after drag behavior
            parentMesh.addChild(rotationCircle);

        })
    
        // Node Caching for onHover Events
        const temp = {
            material,
            hoverMaterial,
            name: axis,
            active: false
        };

        this.meshMap.set(parentMesh as any, temp);

        // Add Mesh / Mat / Observables to global for destroy
        this.materials = [material, hoverMaterial, invisibleMaterial];
        this.meshes = [parentMesh];
        return parentMesh;
    }

    calculateRotationAngle(gizmo: Gizmo, e: any, lastDragPosition: Vector3, planeNormal: Vector3, planeNormalTowardsCamera: Vector3, localPlaneNormalTowardsCamera: Vector3, rotationMatrix: Matrix): number {
        const newVector = e.dragPlanePoint.subtract((gizmo.attachedMesh?.absolutePosition as any)).normalize();
        const originalVector = lastDragPosition.subtract((gizmo.attachedMesh?.absolutePosition as any)).normalize();

        const cross = Vector3.Cross(newVector, originalVector);
        const dot = Vector3.Dot(newVector, originalVector);
        let angle = Math.atan2(cross.length(), dot);
        
        planeNormalTowardsCamera.copyFrom(planeNormal);
        localPlaneNormalTowardsCamera.copyFrom(planeNormal);

        if (gizmo.updateGizmoRotationToMatchAttachedMesh) {
            gizmo?.attachedMesh?.rotationQuaternion?.toRotationMatrix(rotationMatrix);
            localPlaneNormalTowardsCamera = Vector3.TransformCoordinates(planeNormalTowardsCamera, rotationMatrix);
        }

        // Flip up vector depending on which side the camera is on
        if (this.utilityScene.activeCamera) {
            const camVec = this.utilityScene.activeCamera.position.subtract(gizmo?.attachedMesh?.position as any);
            console.log('caulateRotationAngle ', Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0);
            if (Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0) {
                planeNormalTowardsCamera.scaleInPlace(-1);
                localPlaneNormalTowardsCamera.scaleInPlace(-1);
                angle = -angle; 
            }
        }
        const halfCircleSide = Vector3.Dot(localPlaneNormalTowardsCamera, cross) > 0.0;
        if (halfCircleSide) { angle = -angle; }

        return angle;
    }

    calculateDragStartAngle(origin: Vector3, originalVector: Vector3, newVector: Vector3) {
        
        // Calculate Angle from rotation circle resting position, to gizmo click position
        const cross = Vector3.Cross(newVector, originalVector);
        const dot = Vector3.Dot(newVector, originalVector);
        let angle = Math.atan2(-cross.length(), -dot) + Math.PI;
        // Flip if its cross has negitive y orientation
        if (cross.y >= 0) angle = -angle;
        // console.log(new Angle(angle).degrees());
        console.log('regular', (cross.y >= 0), angle);

        const angle2 = this.angleBetween3DCoords(originalVector, origin, newVector);


        return angle2;
    }

    angleBetween3DCoords(coord1: Vector3, coord2: Vector3, coord3: Vector3) {
        // Calculate vector between points 1 and 2
        const v1 = {
            x: coord1.x - coord2.x,
            y: coord1.y - coord2.y,
            z: coord1.z - coord2.z,
        };

        // Calculate vector between points 2 and 3
        const v2 = {
            x: coord3.x - coord2.x,
            y: coord3.y - coord2.y,
            z: coord3.z - coord2.z,
        };

        // The dot product of vectors v1 & v2 is a function of the cosine of the
        // angle between them (it's scaled by the product of their magnitudes).

        // Normalize v1
        const v1mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
        const v1norm = {
            x: v1.x / v1mag,
            y: v1.y / v1mag,
            z: v1.z / v1mag,
        };

        // Normalize v2
        const v2mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
        const v2norm = {
            x: v2.x / v2mag,
            y: v2.y / v2mag,
            z: v2.z / v2mag,
        };

        // Calculate the dot products of vectors v1 and v2
        const dotProducts = v1norm.x * v2norm.x + v1norm.y * v2norm.y + v1norm.z * v2norm.z;
        const cross = Vector3.Cross(v1norm as any, v2norm as any);
        const dot = Vector3.Dot(v1norm as any, v2norm as any);

        // Extract the angle from the dot productsx 
        let angle = (Math.acos(dotProducts) * 180.0) / Math.PI;
        angle = Math.round(angle * 1000) / 1000;
        // if (cross.y >= 0) angle = angle * -1;
        angle = Angle.FromDegrees(angle).radians();
        
        if ((cross.y < 0)) angle = -angle; 
        console.log('enhanced', (cross.y < 0), angle);

        // Round result to 3 decimal points and return
        return angle;
    }

    setupRotationCircle(paths: any[], parentMesh: AbstractMesh) {

        // Prototyped here
        // https://www.babylonjs-playground.com/#V67MGT#143
        
        const fillRadians = 0;
        const step = this.circleConstants.pi2 / this.circleConstants.tessellation;
        
        for (let p = -Math.PI / 2; p < Math.PI / 2 - 1.5; p += step / 2) {
            const path = [];
            for (let i = 0; i < this.circleConstants.pi2; i += step ) {
                if(i < fillRadians) {
                    const x = this.circleConstants.radius * Math.sin(i) * Math.cos(p);
                    const z = this.circleConstants.radius * Math.cos(i) * Math.cos(p);
                    const y = 0;
                    path.push( new BABYLON.Vector3(x, y, z) );
                } else {
                    path.push( new BABYLON.Vector3(0, 0, 0) );
                }
            }
            paths.push(path);
        }

        const mat = this.colorHelper(Color3.Yellow(), this.utilityScene);
        mat.backFaceCulling = false;
        const mesh = BABYLON.Mesh.CreateRibbon("ignore", paths, false, false, 0, this.utilityScene, true);
        mesh.material = mat;
        mesh.material.alpha = .25;

        // Align with gizmo / scene object
        mesh.rotation.x = Math.PI / 2;
        parentMesh.addChild(mesh);

        return mesh;
    }

    updateRotationPath(pathArr: any[], newFill: number) {

        // To update the Ribbon, you have to mutate the pathArray in-place
        const step = this.circleConstants.pi2 / this.circleConstants.tessellation;
        let tessilationCounter = 0;
        for (let p = -Math.PI / 2; p < Math.PI / 2 - 1.5; p += step / 2) {
            const path = pathArr[tessilationCounter];
            if(path) {
                let radianCounter = 0;
                for (let i = 0; i < this.circleConstants.pi2; i += step ) {
                    if(path[radianCounter]) {
                        if(i < Math.abs(newFill)) {
                            const eie = (newFill > 0) ? i : i*-1;
                            const pea = (newFill > 0) ? p : p*-1
                            path[radianCounter].x = this.circleConstants.radius * Math.sin(eie) * Math.cos(pea);
                            path[radianCounter].z = this.circleConstants.radius * Math.cos(eie) * Math.cos(pea);
                            path[radianCounter].y = 0;
                        } else {
                            path[radianCounter].x = 0;
                            path[radianCounter].y = 0;
                            path[radianCounter].z = 0;
                        }
                    }
                    radianCounter++;
                }
            }
            tessilationCounter ++;
        }
        return pathArr;
    }

    updateRotationCircle(mesh: Mesh, paths: any[], newFill: number, dragPlanePoint: Vector3) {

        paths = this.updateRotationPath(paths, newFill);
        mesh = BABYLON.Mesh.CreateRibbon("ribbon", paths, false, false, 0, this.utilityScene, undefined, undefined, mesh);

    }
    

}