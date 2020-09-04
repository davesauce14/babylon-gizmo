import { AxisScaleGizmo, AbstractMesh, BoxBuilder, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3, GizmoManager, MeshBuilder, PlaneRotationGizmo, BabylonFileLoaderConfiguration, Quaternion, Gizmo, Nullable, RotationGizmo, Matrix } from "babylonjs";
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
            const xMesh = this.createRotationMesh(gizmo.xGizmo, this.utilityScene, Color3.Red(), "x" );
            gizmo.xGizmo.setCustomMesh(xMesh);

            // // Set Custom Mesh Y
            const yMesh = this.createRotationMesh(gizmo.yGizmo, this.utilityScene, Color3.Green(), "y" );
            gizmo.yGizmo.setCustomMesh(yMesh);

            // Set Custom Mesh Z
            const zMesh = this.createRotationMesh(gizmo.zGizmo, this.utilityScene, Color3.Blue(), "z" )
            gizmo.zGizmo.setCustomMesh(zMesh);

            this.gizmoMouseObservers(this.utilityScene);
        }
    }

    createRotationMesh(gizmo: PlaneRotationGizmo, scene: Scene, color: Color3, axis: string, tessellation = 32): any {

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

        let planeNormal: Vector3 = new Vector3(1, 0, 0);
        if(axis === 'y'){
            planeNormal = new Vector3(0, 1, 0);
        } else if(axis === 'z'){
            planeNormal = new Vector3(0, 0, 1);
        }

        // Closures
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

            // const test = Mesh.CreateBox("", .05, this.utilityScene);
            // test.position = direction.clone();

            parentMesh.removeChild(rotationCircle);
            
            lastDragPosition.copyFrom(e.dragPlanePoint);
            dragPlanePoint = e.dragPlanePoint;
            // dragPlanePoint = lastDragPosition.subtract((gizmo.attachedMesh?.absolutePosition as any)).normalize();

            // z
            let originalVector = new Vector3(0, 0, 1);
            originalVector = rotationCircle.getAbsolutePosition().clone().addInPlace(direction);
            //const originalVector = savedPosition;
            const clickedVector = e.dragPlanePoint;
            const angle = this.calculateAngle(originalVector, clickedVector, localPlaneNormalTowardsCamera, gizmo, rotationMatrix, planeNormalTowardsCamera);

            // const cross = Vector3.Cross(clickedVector, originalVector);
            // thing2.position = rotationCircle.rotation.add(Vector3.Forward())

            // z
            rotationCircle.addRotation(0, angle, 0);

            // const thing2 = Mesh.CreateBox("", .05, this.utilityScene);
            // thing2.position = rotationCircle.getAbsolutePosition().clone();
            // // thing2.position = rotationCircle.getAbsolutePosition().clone();
            // thing2.position.addInPlace(direction);

            // rotationCircle.addRotation(0, 0, angle);
            
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
            // rotationCircle.rotation = new Vector3(gizmo.attachedMesh?.rotation.x, gizmo.attachedMesh?.rotation.y, gizmo.attachedMesh?.rotation.z);
            parentMesh.addChild(rotationCircle);

        })
    
        const temp = {
            material,
            hoverMaterial,
            name: axis,
            active: false
        };

        this.meshMap.set(parentMesh as any, temp);
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
        // console.log(this.utilityScene.activeCamera);
        if (this.utilityScene.activeCamera) {
            const camVec = this.utilityScene.activeCamera.position.subtract(gizmo?.attachedMesh?.position as any);
            console.log('regular', Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0)
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

    calculateAngle(originalVector: Vector3, newVector: Vector3, localPlaneNormalTowardsCamera: Vector3, gizmo: Gizmo, rotationMatrix: Matrix, planeNormalTowardsCamera: Vector3) {
        const cross = Vector3.Cross(newVector, originalVector);
        const dot = Vector3.Dot(newVector, originalVector);
        let angle = Math.atan2(cross.length(), dot);


        // if (gizmo.updateGizmoRotationToMatchAttachedMesh) {
        //     gizmo?.attachedMesh?.rotationQuaternion?.toRotationMatrix(rotationMatrix);
        //     localPlaneNormalTowardsCamera = Vector3.TransformCoordinates(planeNormalTowardsCamera, rotationMatrix);
        // }

        // Flip up vector depending on which side the camera is on
        // console.log(this.utilityScene.activeCamera);
        if (this.utilityScene.activeCamera) {
            const camVec = this.utilityScene.activeCamera.position.subtract(gizmo?._rootMesh.position as any);
            console.log('other', Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0)
            if (Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0) {
                // planeNormalTowardsCamera.scaleInPlace(-1);
                // localPlaneNormalTowardsCamera.scaleInPlace(-1);
                // angle = -angle; 
            }
        }

        // Calculate negative Drag
        const halfCircleSide = Vector3.Dot(localPlaneNormalTowardsCamera, cross) > 0.0;
        if (halfCircleSide) { angle = -angle; }
        // console.log(angle, halfCircleSide);
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