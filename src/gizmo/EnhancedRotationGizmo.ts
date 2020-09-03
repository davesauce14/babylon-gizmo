import { AxisScaleGizmo, AbstractMesh, BoxBuilder, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3, GizmoManager, MeshBuilder, PlaneRotationGizmo, BabylonFileLoaderConfiguration } from "babylonjs";
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
        // this.rotationCircle = this.setupRotationCircle(this.rotationPaths);
        // console.log(this.rotationCircle, this.rotationPaths)
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

        // Closures
        let dragDistance = 0;
        const rotationCirclePaths: any[] = [];
        const rotationCircle: Mesh = this.setupRotationCircle(rotationCirclePaths, parentMesh);
        let initialPos = new BABYLON.Vector3(parentMesh.rotation.x, parentMesh.rotation.y, parentMesh.rotation.z);
        let currentPos = new BABYLON.Vector3(parentMesh.rotation.x, parentMesh.rotation.y, parentMesh.rotation.z);
        let finalPos: any = {};
        let deltaVector = new Vector3();

        gizmo.dragBehavior.onDragStartObservable.add(e => {
            console.log(e);
            parentMesh.removeChild(rotationCircle);
            initialPos = e.dragPlanePoint;
        })

        gizmo.dragBehavior.onDragObservable.add(e => {
            dragDistance += e.dragDistance;
            // console.log(initialPos.subtract(e.dragPlaneNormal));
            // console.log(initialPos.subtract(e.dragPlanePoint));
            //const diff = e.delta.subtract(deltaVector);
            // console.log(e, diff, e.dragPlanePoint, deltaVector);
            // console.log(e.delta);
            deltaVector = e.delta;
            currentPos = new BABYLON.Vector3((parentMesh.parent as any)?.rotation?.x, (parentMesh.parent as any)?.rotation?.y, (parentMesh.parent as any)?.rotation?.z);
            // dragDistance = Math.atan2(initialPos.x - currentPos.x, initialPos.z - currentPos.z);
            // console.log(dragDistance);
            // dragDistance += (e as any).delta[axis];
            this.updateRotationCircle(rotationCircle, rotationCirclePaths, dragDistance);
            //console.log(axis, e.dragDistance, dragDistance, e);
            finalPos = e;
        })

        gizmo.dragBehavior.onDragEndObservable.add(e => {
            dragDistance = 0;
            // console.log('end ', dragDistance, e);
            // console.log(initialPos);
            // console.log(parentMesh);
            // console.log(new BABYLON.Vector3(parentMesh.rotation.x, parentMesh.rotation.y, parentMesh.rotation.z))
            // console.log(finalPos);

            const angle = Math.acos(BABYLON.Vector3.Dot(initialPos, finalPos));
            const axiss = BABYLON.Vector3.Cross(initialPos, finalPos);
            const quaternion = BABYLON.Quaternion.RotationAxis(axiss, angle);
            // console.log(angle, axiss, quaternion)
            this.updateRotationCircle(rotationCircle, rotationCirclePaths, dragDistance);
            parentMesh.addChild(rotationCircle);
        })
    
    
        if (axis === "x") {
            parentMesh.rotation.y = Math.PI / 2;
        } else if (axis === "y") {
            parentMesh.rotation.x = (Math.PI / 2) * -1;
        }
    
        const temp = {
            material,
            hoverMaterial,
            name: axis,
            active: false
        };

        this.meshMap.set(parentMesh as any, temp);
        return parentMesh;
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
        mesh.material.alpha = .3;

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
                        if(i < newFill) {
                            path[radianCounter].x = this.circleConstants.radius * Math.sin(i) * Math.cos(p);
                            path[radianCounter].z = this.circleConstants.radius * Math.cos(i) * Math.cos(p);
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

    updateRotationCircle(mesh: Mesh, paths: any[], newFill: number) {

        paths = this.updateRotationPath(paths, newFill);
        mesh = BABYLON.Mesh.CreateRibbon("ribbon", paths, false, false, 0, this.utilityScene, undefined, undefined, mesh);

        // mesh.rotation.x = rotationVector.x;
        // mesh.rotation.y = rotationVector.y;
        // mesh.rotation.z = rotationVector.z;
    }
    

}