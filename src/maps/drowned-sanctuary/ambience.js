    const hemi=new THREE.HemisphereLight('#c8e2d9','#1a1b16',2.0);
    scene.add(hemi);
    const sun=new THREE.DirectionalLight('#e5d4ad',3.2);
    sun.position.set(32,67,40);
    sun.castShadow=true;
    sun.shadow.mapSize.set(isSmall?1024:2048,isSmall?1024:2048);
    sun.shadow.camera.left=-80; sun.shadow.camera.right=80;
    sun.shadow.camera.top=75; sun.shadow.camera.bottom=-85;
    sun.shadow.camera.near=2; sun.shadow.camera.far=240;
    sun.shadow.bias=-.00045;
    sun.shadow.normalBias=.035;
    scene.add(sun,sun.target);
    const ambientRim=new THREE.DirectionalLight('#789c95',1.75);
    ambientRim.position.set(-35,20,-40);
    scene.add(ambientRim);
    const stoneMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
    const barkMaterial=stoneMaterial.clone();
    const woodMaterial=stoneMaterial.clone();
    const floorMat=new THREE.MeshStandardMaterial({color:'#27332c',roughness:1});
    // Underwater earth with clear shore boundaries.
    const bed=new THREE.Mesh(new THREE.CircleGeometry(115,100),floorMat);
    bed.rotation.x=-Math.PI/2;
    bed.position.y=-1.30;
    bed.receiveShadow=true;
    scene.add(bed);
    const farEarth=new THREE.Mesh(new THREE.CylinderGeometry(119,107,8,80),new THREE.MeshStandardMaterial({color:'#151f1d',roughness:1}));
    farEarth.position.y=-6;
    farEarth.receiveShadow=true;
    scene.add(farEarth);

    const mossSpots=[];
    const living={};

    // Water is a true animated surface, not a flat blue panel.
    const waterUniforms={
      uTime:{value:0},uMoon:{value:0},
      uColorA:{value:new THREE.Color('#142a28').convertSRGBToLinear()},
      uColorB:{value:new THREE.Color('#4e7269').convertSRGBToLinear()}
    };
    const waterMat=new THREE.ShaderMaterial({
      uniforms:waterUniforms,
      transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:`
        uniform float uTime;
        varying vec2 vPos;
        varying float vHeight;
        void main(){
          vec3 p=position;
          float w=sin(p.x*.43+uTime*1.6)*.035+cos(p.y*.34-uTime*1.3)*.04;
          w+=sin((p.x+p.y)*.14+uTime*.65)*.055;
          p.z+=w;vHeight=w;vPos=p.xy;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
        }`,
      fragmentShader:`
        uniform float uTime;uniform float uMoon;
        uniform vec3 uColorA;uniform vec3 uColorB;
        varying vec2 vPos;varying float vHeight;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){
          float ripple=sin(vPos.x*.64+uTime*1.8)*cos(vPos.y*.5-uTime*1.25);
          float sh=sin(vPos.x*.12+vPos.y*.19+uTime*.5);
          vec3 col=mix(uColorA,uColorB,clamp(.35+vHeight*2.2+ripple*.12+sh*.14,0.,1.));
          float glitter=pow(max(0.,sin(vPos.x*1.8+uTime*1.3)*cos(vPos.y*1.3-uTime*.9)),24.);
          col+=vec3(.26,.31,.28)*glitter*(.45+.45*uMoon);
          // Soft skyline reflection approximation and localized pillar ripples.
          vec2 q=vec2(vPos.x,-vPos.y);
          float reflection=exp(-pow((q.x+19.2)/4.5,2.))*exp(-abs(q.y+10.)*.09);
          reflection+=exp(-pow((q.x-20.2)/4.2,2.))*exp(-abs(q.y+12.)*.09);
          reflection+=exp(-pow((q.x-31.4)/3.8,2.))*exp(-abs(q.y-18.)*.12);
          col*=1.-clamp(reflection*.25,0.,.4);
          float d=length(q-vec2(-18.2,13.5));
          col+=vec3(.08,.10,.08)*sin(d*6.-uTime*1.1)*exp(-d*.28)*.4;
          gl_FragColor=vec4(col,.76);
        }`
    });
    const waterGeo=new THREE.PlaneGeometry(215,215,isSmall?90:160,isSmall?90:160);
    const water=new THREE.Mesh(waterGeo,waterMat);
    water.rotation.x=-Math.PI/2;
    water.position.y=-.005;
    water.renderOrder=2;
    scene.add(water);

    // Gallery of layered fog sheets, reeds, fireflies, drifting pollen, birds and ripples.
    function addFoliage(spots){
      const maxSpots=isSmall?1700:3200;
      const subset=spots.length>maxSpots?spots.filter((_,i)=>i%Math.ceil(spots.length/maxSpots)===0):spots;
      const leafGeometry=new THREE.BoxGeometry(1,1,1);
      const greenMat=new THREE.MeshStandardMaterial({vertexColors:false,color:'#596b43',roughness:1,side:THREE.DoubleSide});
      const goldenMat=new THREE.MeshStandardMaterial({color:'#89916b',roughness:1});
      const leaf=new THREE.InstancedMesh(leafGeometry,greenMat,subset.length*3);
      const bright=new THREE.InstancedMesh(leafGeometry,goldenMat,subset.length);
      const dummy=new THREE.Object3D();let i=0,j=0;
      for(let k=0;k<subset.length;k++){
        const f=subset[k], s=f.scale||.5;
        const seed=hash3(f.x*10,f.y*10,f.z*10);
        for(let n=0;n<3;n++){
          dummy.position.set(f.x+(n-1)*s*.22,f.y+s*.10+seed*.15,f.z+(n-1)*s*.12);
          dummy.rotation.set(seed*.3,(seed+n)*Math.PI*1.7,(seed-.5)*.55);
          dummy.scale.set(s*(f.type==='ivy'?.75:.60),s*(f.type==='ivy'?.25:.12),s*.55);
          dummy.updateMatrix();leaf.setMatrixAt(i++,dummy.matrix);
        }
        dummy.position.set(f.x,f.y+s*.2,f.z);
        dummy.scale.set(s*.45,s*.14,s*.42);
        dummy.rotation.set(.1,seed*Math.PI,0);
        dummy.updateMatrix();bright.setMatrixAt(j++,dummy.matrix);
      }
      leaf.count=i;bright.count=j;
      leaf.instanceMatrix.needsUpdate=true;bright.instanceMatrix.needsUpdate=true;
      leaf.castShadow=false;bright.castShadow=false;
      living.foliage=[leaf,bright];scene.add(leaf,bright);
    }
    function addReeds(){
      const mat=new THREE.MeshStandardMaterial({color:'#7a8061',roughness:1,side:THREE.DoubleSide});
      mat.onBeforeCompile=shader=>{shader.uniforms.sanctuaryTime=waterUniforms.uTime;shader.vertexShader='uniform float sanctuaryTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x+=sin(sanctuaryTime*.7+instanceMatrix[3].x*.3+instanceMatrix[3].z*.2)*position.y*.12;');};
      const geo=new THREE.ConeGeometry(.046,1,3);
      geo.translate(0,.5,0);
      const count=isSmall?400:1100;
      const reeds=new THREE.InstancedMesh(geo,mat,count);
      const dummy=new THREE.Object3D();
      for(let i=0;i<count;i++){
        let a=rand()*Math.PI*2,r=10+rand()*33;
        let x=Math.cos(a)*r,z=3.2+Math.sin(a)*r;
        if(z>17&&Math.abs(x)<3){x+=5}
        const h=.35+rand()*1.2;
        dummy.position.set(x,-.30,z);
        dummy.rotation.set((rand()-.5)*.20,rand()*Math.PI*2,(rand()-.5)*.25);
        dummy.scale.set(.65+rand()*.5,h,.65+rand()*.5);
        dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);
      }
      reeds.instanceMatrix.needsUpdate=true;
      reeds.frustumCulled=false;
      living.reeds=reeds;scene.add(reeds);
    }
    function addMotes(){
      const n=isSmall?420:1050;
      const p=new Float32Array(n*3),seed=new Float32Array(n);
      for(let i=0;i<n;i++){
        p[i*3]=(rand()-.5)*110;
        p[i*3+1]=.3+rand()*34;
        p[i*3+2]=(rand()-.5)*110;
        seed[i]=rand()*20;
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));
      const shader=new THREE.ShaderMaterial({
        uniforms:{uTime:waterUniforms.uTime,uMoon:waterUniforms.uMoon},
        vertexShader:`uniform float uTime;varying float tw;void main(){vec3 p=position;
          p.y+=sin(uTime*.35+p.x*.13+p.z*.20)*.28;
          p.x+=sin(uTime*.14+p.y*.15)*.55;
          vec4 v=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(210./-v.z,1.2,5.0);
          gl_Position=projectionMatrix*v;
          tw=.6+.4*sin(uTime*1.6+p.x*.21);
        }`,
        fragmentShader:`uniform float uMoon;varying float tw;void main(){float r=length(gl_PointCoord-.5);
          float a=(1.0-smoothstep(.05,.50,r))*tw*(.24+.56*uMoon);
          gl_FragColor=vec4(mix(vec3(.69,.69,.47),vec3(.77,1.,.82),uMoon),a);
        }`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
      });
      living.motes=new THREE.Points(geo,shader);scene.add(living.motes);
    }
    function addFogSheets(){
      const geo=new THREE.PlaneGeometry(55,26);
      const mat=new THREE.MeshBasicMaterial({color:'#7a9a8f',transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide});
      living.fog=[];
      for(let i=0;i<12;i++){
        const fm=mat.clone();fm.onBeforeCompile=shader=>{shader.vertexShader='varying vec2 fogUV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n fogUV=uv;');shader.fragmentShader='varying vec2 fogUV;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.a*=smoothstep(0.,.3,fogUV.x)*smoothstep(0.,.3,1.-fogUV.x)*smoothstep(0.,.3,fogUV.y)*smoothstep(0.,.3,1.-fogUV.y);');};const f=new THREE.Mesh(geo,fm);
        f.rotation.x=-Math.PI/2;
        f.position.set((rand()-.5)*80,.04+i*.11,(rand()-.5)*75);
        f.rotation.z=rand()*Math.PI;
        f.userData={x:f.position.x,z:f.position.z,phase:rand()*6};
        scene.add(f);living.fog.push(f);
      }
    }
    function makeBirds(){
      const wing=new THREE.BoxGeometry(1,.09,.15);
      const mat=new THREE.MeshBasicMaterial({color:'#536761'});
      living.birds=[];
      for(let i=0;i<11;i++){
        const g=new THREE.Group();
        const left=new THREE.Mesh(wing,mat),right=new THREE.Mesh(wing,mat);
        left.position.x=-.5;right.position.x=.5;
        g.add(left,right);g.userData={left,right,i};
        g.scale.setScalar(.35+rand()*.5);
        scene.add(g);living.birds.push(g);
      }
    }
    // Lone pilgrim: layered hood, moving cloak and emissive lantern.
    function createPilgrim(){
      const g=new THREE.Group();
      const cape=new THREE.Mesh(new THREE.ConeGeometry(.48,1.4,6),new THREE.MeshStandardMaterial({color:'#382e29',roughness:1}));
      cape.position.y=1.07;cape.rotation.y=.15;g.add(cape);
      const torso=new THREE.Mesh(new THREE.BoxGeometry(.64,.9,.35),new THREE.MeshStandardMaterial({color:'#463930'}));
      torso.position.y=1.35;g.add(torso);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.25,9,7),new THREE.MeshStandardMaterial({color:'#1d2420'}));
      head.position.y=2.02;g.add(head);
      const hood=new THREE.Mesh(new THREE.ConeGeometry(.34,.45,6),new THREE.MeshStandardMaterial({color:'#2d302b'}));
      hood.position.y=2.25;g.add(hood);
      const shaft=new THREE.Mesh(new THREE.BoxGeometry(.13,.58,.13),new THREE.MeshStandardMaterial({color:'#6b5a3b'}));
      shaft.position.set(.48,1.2,.05);shaft.rotation.z=-.24;g.add(shaft);
      const lantern=new THREE.Mesh(new THREE.BoxGeometry(.26,.35,.26),new THREE.MeshStandardMaterial({
        color:'#aa8952',emissive:'#f6b86d',emissiveIntensity:3.6,metalness:.15
      }));lantern.position.set(.58,.90,.07);g.add(lantern);
      const light=new THREE.PointLight('#f9bf7c',2.8,9,2);light.position.copy(lantern.position);g.add(light);
      g.userData={cape,lantern,light};
      scene.add(g);living.pilgrim=g;
    }

    // Three clickable rune relics are the micro-game loop: awaken the sanctuary.
    const relics=[];
    const relicInfo=[
      {title:'The First Echo',desc:'A breath of forgotten prayer lingers in the flooded cloister.',pos:[-10,1.45,11],color:'#8edab9'},
      {title:'The Bell of Returning',desc:'Its bronze remembers a thousand vanished dawns.',pos:[19.0,1.5,10.0],color:'#dbc38b'},
      {title:'The Rootbound Oath',desc:'Beneath the stone, the old forest has never stopped listening.',pos:[-13.0,1.4,-9.0],color:'#b3d47c'}
    ];
    function createRelics(){
      const stone=new THREE.MeshStandardMaterial({color:'#3e4b43',roughness:1});
      const haloGeo=new THREE.TorusGeometry(.70,.055,5,40);
      for(let i=0;i<3;i++){
        const cfg=relicInfo[i], g=new THREE.Group();
        g.position.set(...cfg.pos);
        const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.73,.94,1.1,6),stone);
        pedestal.position.y=-.63;pedestal.castShadow=true;g.add(pedestal);
        const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.42,0),new THREE.MeshStandardMaterial({
          color:cfg.color,emissive:cfg.color,emissiveIntensity:1.5,roughness:.26,metalness:.32
        }));gem.position.y=.35;g.add(gem);
        const ring=new THREE.Mesh(haloGeo,new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:.75}));
        ring.position.y=.35;ring.rotation.x=.45;g.add(ring);
        const light=new THREE.PointLight(cfg.color,2.0,7,2);light.position.y=.45;g.add(light);
        const hit=new THREE.Mesh(new THREE.SphereGeometry(1.7,10,8),new THREE.MeshBasicMaterial({visible:false}));
        hit.userData.relicId=i;g.add(hit);
        scene.add(g);relics.push({g,gem,ring,light,hit,active:false});
      }
    }
