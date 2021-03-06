/// <reference path="references.ts" />

class Clock
{
    private scene:THREE.Scene;
    private camera:Orbit_camera;
    private clock:THREE.Object3D;
    private lighting:THREE.Object3D;

    private mechanics:Mechanics;

    private dragging = false;
    private prevDragX:number;
    private prevDragY:number;

    constructor (private renderer:THREE.WebGLRenderer,
                 private width:number, private height:number,
                 loader:THREE.LoadingManager)
    {
        this.scene = new THREE.Scene ();
        this.camera = new Orbit_camera (60, width / height);
        this.camera.position.z = 5;

        this.init_lighting ();
        this.load_clock (loader);

        this.renderer.domElement.addEventListener ('mousedown', this.on_mouse_down.bind (this));
        window.addEventListener ('mousemove', this.on_mouse_move.bind (this));
        window.addEventListener ('mouseup', this.on_mouse_up.bind (this));
        window.addEventListener ('wheel', this.on_mouse_wheel.bind (this));

        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    }

    public render ()
    {
        this.renderer.render (this.scene, this.camera);
    }

    public update (dt:number)
    {
        this.camera.update (dt);
        this.lighting.rotation.copy (this.camera.rotation);
        if (this.mechanics)
        {
            this.mechanics.update (dt);
        }
    }

    public set_speed (speed:number)
    {
        if (this.mechanics)
        {
            this.mechanics.time_scale = speed;
        }
    }

    public resize (w:number, h:number)
    {
        this.width = w;
        this.height = h;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    public look_at_part (part:string)
    {
        var orientations = {
            gear_hours: [Math.PI, 0, 16],
            pendulum: [0.61, 0.05, 7],
            anchor: [-2.8, 0, 5],
            escape_wheel: [Math.PI, 0, 6.2],
            movement_spring: [0.58, 0.34, 11],
        };
        this.camera.set_look_at (this.clock.getObjectByName (part).position);
        var orientation = orientations[part];
        this.camera.horizontal = orientation[0];
        this.camera.vertical = orientation[1];
        this.camera.set_zoom (orientation[2]);
    }

    private on_mouse_down (e:MouseEvent)
    {
        if (e.button != 0)
        {
            return;
        }
        this.dragging = true;
        this.prevDragX = e.clientX;
        this.prevDragY = e.clientY;
    }

    private on_mouse_move (e:MouseEvent)
    {
        if (!this.dragging)
        {
            return;
        }
        var dx = e.clientX - this.prevDragX;
        var dy = e.clientY - this.prevDragY;
        this.prevDragX = e.clientX;
        this.prevDragY = e.clientY;

        if (!e.shiftKey)
        {
            var rotation_factor = 0.004;
            this.camera.rotate (dx * rotation_factor, dy * rotation_factor);
        }
        else
        {
            var pan_factor = 0.0025;
            this.camera.pan (-dx * pan_factor, dy * pan_factor);
        }
    }

    private on_mouse_up (e:MouseEvent)
    {
        if (e.button != 0)
        {
            return;
        }
        this.dragging = false;
    }

    private on_mouse_wheel (e:WheelEvent)
    {
        var zoom_factor = 0.1;
        this.camera.zoom_camera (e.deltaY * zoom_factor);
    }

    private init_lighting ()
    {
        this.lighting = new THREE.Object3D ();
        this.scene.add (this.lighting);

        this.lighting.add (new THREE.AmbientLight (0x666666));

        var light = new THREE.DirectionalLight (0xffffff, 0.5);
        light.position.set (0, 1, 1);
        this.lighting.add (light);
    }

    private load_clock (manager:THREE.LoadingManager)
    {
        var loader = new THREE.ObjectLoader (manager);
        loader.load ('assets/clock.json', this.on_clock_load.bind (this));
        // TODO how are errors handled
    }

    private on_clock_load (obj:THREE.Object3D)
    {
        this.clock = obj;
        this.scene.add (obj);
        this.mechanics = new Mechanics (obj);

        var box = new THREE.Box3 ().setFromObject (obj);
        box.min.z *= 2;
        box.max.z *= 2;
        this.camera.restrict_look_at (box);

        this.look_at_part ("gear_hours");
    }
}
