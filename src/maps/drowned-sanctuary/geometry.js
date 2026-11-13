// Source-derived geometry; enclosed in the map factory by the offline builder.
    const collisionBoxes=[],landmarks=[],stairs=[];
    // Mulberry32 deterministic PRNG
    function createPRNG(seed) {
      let s = seed >>> 0;
      return function() {
        s += 0x6D2B79F5;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rand = createPRNG(CONFIG.seed);

    // Deterministic 3D spatial hash & smooth value noise
    function hash3(x, y, z) {
      let n = Math.imul(Math.floor(x), 374761393) +
              Math.imul(Math.floor(y), 668265263) +
              Math.imul(Math.floor(z), 2147483647);
      n = (n ^ (n >>> 13)) * 1274126177;
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }

    function noise3D(x, y, z) {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = x - xi, yf = y - yi, zf = z - zi;
      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);
      const w = zf * zf * (3 - 2 * zf);

      const n000 = hash3(xi, yi, zi),     n100 = hash3(xi + 1, yi, zi);
      const n010 = hash3(xi, yi + 1, zi), n110 = hash3(xi + 1, yi + 1, zi);
      const n001 = hash3(xi, yi, zi + 1), n101 = hash3(xi + 1, yi, zi + 1);
      const n011 = hash3(xi, yi + 1, zi + 1), n111 = hash3(xi + 1, yi + 1, zi + 1);

      const nx00 = n000 + u * (n100 - n000);
      const nx10 = n010 + u * (n110 - n010);
      const nx01 = n001 + u * (n101 - n001);
      const nx11 = n011 + u * (n111 - n011);

      const nxy0 = nx00 + v * (nx10 - nx00);
      const nxy1 = nx01 + v * (nx11 - nx01);

      return nxy0 + w * (nxy1 - nxy0);
    }

    function fbm3(x, y, z, octaves = 3) {
      let val = 0, amp = 0.5, freq = 1.0, norm = 0;
      for (let i = 0; i < octaves; i++) {
        val += amp * noise3D(x * freq, y * freq, z * freq);
        norm += amp;
        amp *= 0.5;
        freq *= 2.07;
      }
      return val / norm;
    }

    function clamp(v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    }

    function smoothstep(edge0, edge1, x) {
      const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return t * t * (3.0 - 2.0 * t);
    }

    /* ============================================================================
     * 2. PALETTE & PROCEDURAL STONE / BARK / MOSS COLORING
     * ============================================================================ */
    const PALETTE = {
      limestone: new THREE.Color('#B5AD94').convertSRGBToLinear(),
      warmHighlight: new THREE.Color('#D3C5A3').convertSRGBToLinear(),
      erodedSandstone: new THREE.Color('#97907C').convertSRGBToLinear(),
      wetStone: new THREE.Color('#4A5044').convertSRGBToLinear(),
      darkGranite: new THREE.Color('#3B3F38').convertSRGBToLinear(),
      darkMoss: new THREE.Color('#3F4B35').convertSRGBToLinear(),
      lushMoss: new THREE.Color('#4E5D3F').convertSRGBToLinear(),
      lichen: new THREE.Color('#C2B99B').convertSRGBToLinear(),
      rootDark: new THREE.Color('#3C3020').convertSRGBToLinear(),
      rootMid: new THREE.Color('#57452C').convertSRGBToLinear(),
      rootGold: new THREE.Color('#8E703E').convertSRGBToLinear(),
      bellBronze: new THREE.Color('#3F382B').convertSRGBToLinear(),
      woodBeam: new THREE.Color('#3A2E22').convertSRGBToLinear(),
      reedLight: new THREE.Color('#A39B7E').convertSRGBToLinear(),
      reedDark: new THREE.Color('#5A6147').convertSRGBToLinear(),
      deepWater: new THREE.Color('#132422').convertSRGBToLinear(),
      fogGrey: new THREE.Color('#9EA298').convertSRGBToLinear()
    };

    const _tmpCol = new THREE.Color();
    const _tmpCol2 = new THREE.Color();

    /**
     * Computes a rich, weathered vertex color for stone masonry based on 3D world position,
     * local ambient occlusion factor, mossiness, and elevation above the water plane (y=0).
     */
    function computeStoneColor(wx, wy, wz, ao = 1.0, extraMoss = 0.0, isStatue = false) {
      const n1 = fbm3(wx * 0.18, wy * 0.18, wz * 0.18, 3);
      const n2 = noise3D(wx * 0.85, wy * 0.85, wz * 0.85);
      const streak = noise3D(wx * 0.45, wy * 0.08, wz * 0.45); // vertical rain stains

      // Base limestone to warm sandstone blend
      _tmpCol.copy(PALETTE.limestone).lerp(PALETTE.warmHighlight, clamp((n1 - 0.35) * 1.6, 0, 1));
      if (isStatue) {
        _tmpCol.lerp(PALETTE.lichen, 0.18);
      }

      // Vertical mineral / rain staining
      if (streak < 0.44) {
        _tmpCol.lerp(PALETTE.darkGranite, (0.44 - streak) * 0.75);
      }

      // Block-level jitter
      _tmpCol.offsetHSL(0, (n2 - 0.5) * 0.04, (n2 - 0.5) * 0.09);

      // Waterline darkening & algae stain near y = 0..2.4
      if (wy < 2.6) {
        const wetFactor = smoothstep(2.6, -0.2, wy);
        _tmpCol.lerp(PALETTE.wetStone, wetFactor * 0.78);
        if (wy < 0.55) {
          _tmpCol.lerp(PALETTE.darkGranite, smoothstep(0.55, -0.4, wy) * 0.55);
        }
      }

      // Moss accumulation on crevices, statue ledges, and damp zones
      const mossNoise = fbm3(wx * 0.35 + 19.3, wy * 0.35, wz * 0.35 - 7.1, 2);
      const mossChance = extraMoss + (wy < 3.5 ? (1.0 - wy / 3.5) * 0.32 : 0) + (mossNoise - 0.52) * 0.9;
      if (mossChance > 0.22) {
        _tmpCol2.copy(PALETTE.darkMoss).lerp(PALETTE.lushMoss, clamp(n2, 0, 1));
        _tmpCol.lerp(_tmpCol2, clamp((mossChance - 0.22) * 1.65, 0, 0.88));
      }

      // Sunlit upper-right warmth vs shadow cavity AO
      _tmpCol.multiplyScalar(clamp(ao, 0.28, 1.08));
      return _tmpCol;
    }

    /* ============================================================================
     * 3. VOXEL & MESH BUILDER UTILITIES
     * ============================================================================ */
    class VoxelBatchBuilder {
      constructor() {
        this.positions = [];
        this.normals = [];
        this.colors = [];
        this.indices = [];
        this.vertexCount = 0;
      }

      /**
       * Appends an oriented or axis-aligned beveled/chipped voxel block with per-vertex
       * baked ambient occlusion and procedural weathered coloring.
       */
      addBox(cx, cy, cz, sx, sy, sz, colorFn, options = {}) {
        collisionBoxes.push({center:[cx,cy,cz],size:[sx,sy,sz],rotation:[options.rotX||0,options.rotY||0,options.rotZ||0]});
        const rotY = options.rotY || 0;
        const rotX = options.rotX || 0;
        const rotZ = options.rotZ || 0;
        const aoBottom = options.aoBottom !== undefined ? options.aoBottom : 0.72;
        const aoTop = options.aoTop !== undefined ? options.aoTop : 1.03;
        const chip = options.chip || 0.0;
        const mortarInset = options.mortar !== undefined ? options.mortar : 0.025;

        const hx = Math.max(0.02, sx * 0.5 - mortarInset);
        const hy = Math.max(0.02, sy * 0.5 - mortarInset);
        const hz = Math.max(0.02, sz * 0.5 - mortarInset);

        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);
        const hasRot = (rotY !== 0 || rotX !== 0 || rotZ !== 0);

        const transformPt = (lx, ly, lz) => {
          let x = lx, y = ly, z = lz;
          if (chip > 0) {
            const j = (hash3(cx * 13 + lx * 7, cy * 17 + ly * 11, cz * 19 + lz * 5) - 0.5) * chip;
            x += j; y += j * 0.7; z += j;
          }
          if (hasRot) {
            if (rotX !== 0) {
              const ny = y * cosX - z * sinX;
              const nz = y * sinX + z * cosX;
              y = ny; z = nz;
            }
            if (rotZ !== 0) {
              const nx = x * cosZ - y * sinZ;
              const ny = x * sinZ + y * cosZ;
              x = nx; y = ny;
            }
            if (rotY !== 0) {
              const nx = x * cosY + z * sinY;
              const nz = -x * sinY + z * cosY;
              x = nx; z = nz;
            }
          }
          return [cx + x, cy + y, cz + z];
        };

        const transformNorm = (nx, ny, nz) => {
          let x = nx, y = ny, z = nz;
          if (hasRot) {
            if (rotX !== 0) {
              const ty = y * cosX - z * sinX;
              const tz = y * sinX + z * cosX;
              y = ty; z = tz;
            }
            if (rotZ !== 0) {
              const tx = x * cosZ - y * sinZ;
              const ty = x * sinZ + y * cosZ;
              x = tx; y = ty;
            }
            if (rotY !== 0) {
              const tx = x * cosY + z * sinY;
              const tz = -x * sinY + z * cosY;
              x = tx; z = tz;
            }
          }
          return [x, y, z];
        };

        // 6 faces of the box
        const faces = [
          // +X
          { n: [1, 0, 0], v: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], ao: [aoBottom, aoBottom, aoTop, aoTop] },
          // -X
          { n: [-1, 0, 0], v: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], ao: [aoBottom, aoBottom, aoTop, aoTop] },
          // +Y
          { n: [0, 1, 0], v: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], ao: [aoTop, aoTop, aoTop, aoTop] },
          // -Y
          { n: [0, -1, 0], v: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], ao: [aoBottom * 0.8, aoBottom * 0.8, aoBottom * 0.8, aoBottom * 0.8] },
          // +Z
          { n: [0, 0, 1], v: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], ao: [aoBottom, aoBottom, aoTop, aoTop] },
          // -Z
          { n: [0, 0, -1], v: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], ao: [aoBottom, aoBottom, aoTop, aoTop] }
        ];

        const skipBottom = options.skipBottom === true;

        for (let f = 0; f < 6; f++) {
          if (skipBottom && f === 3) continue;
          const face = faces[f];
          const wn = transformNorm(face.n[0], face.n[1], face.n[2]);
          const baseIdx = this.vertexCount;

          for (let k = 0; k < 4; k++) {
            const wp = transformPt(face.v[k][0], face.v[k][1], face.v[k][2]);
            this.positions.push(wp[0], wp[1], wp[2]);
            this.normals.push(wn[0], wn[1], wn[2]);

            const col = colorFn(wp[0], wp[1], wp[2], face.ao[k]);
            this.colors.push(col.r, col.g, col.b);
          }

          this.indices.push(
            baseIdx, baseIdx + 1, baseIdx + 2,
            baseIdx, baseIdx + 2, baseIdx + 3
          );
          this.vertexCount += 4;
        }
      }

      toBufferGeometry() {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
        geo.setIndex(this.indices);
        geo.computeBoundingSphere();
        return geo;
      }
    }

    /* ============================================================================
     * 4. ARCHITECTURAL PRIMITIVES (GOTHIC ARCHES, PIERS, TOWERS, STAIRS)
     * ============================================================================ */

    /**
     * Builds a clustered Gothic column/pier with molded base, shaft drums, and carved capital.
     */
    function buildClusteredPier(builder, x, y0, z, height, radius = 1.35, rotY = 0, ruinTop = false) {
      const stdColor = (wx, wy, wz, ao) => computeStoneColor(wx, wy, wz, ao, 0.08);
      // Plinth & Molded Base
      builder.addBox(x, y0 + 0.45, z, radius * 2.5, 0.9, radius * 2.5, stdColor, { rotY, aoBottom: 0.55, chip: 0.06, skipBottom: true });
      builder.addBox(x, y0 + 1.15, z, radius * 2.15, 0.65, radius * 2.15, stdColor, { rotY, aoBottom: 0.68, chip: 0.05, skipBottom: true });

      // Clustered shaft drums
      const shaftH = height - 2.6;
      const drumCount = Math.max(3, Math.floor(shaftH / 1.35));
      const drumH = shaftH / drumCount;

      for (let i = 0; i < drumCount; i++) {
        const dy = y0 + 1.45 + (i + 0.5) * drumH;
        if (ruinTop && i === drumCount - 1 && hash3(x, dy, z) > 0.5) continue;

        const jitter = (hash3(x * 7, i * 13, z * 11) - 0.5) * 0.07;
        // Core square pier + 4 engaged colonnette shafts
        builder.addBox(x, dy, z, radius * 1.55 + jitter, drumH, radius * 1.55 + jitter, stdColor, {
          rotY, aoBottom: 0.82, aoTop: 0.98, chip: 0.04, mortar: 0.025, skipBottom: true
        });
        builder.addBox(x, dy, z, radius * 1.92, drumH * 0.96, radius * 0.78, stdColor, {
          rotY, aoBottom: 0.8, aoTop: 0.96, chip: 0.03, mortar: 0.02, skipBottom: true
        });
        builder.addBox(x, dy, z, radius * 0.78, drumH * 0.96, radius * 1.92, stdColor, {
          rotY, aoBottom: 0.8, aoTop: 0.96, chip: 0.03, mortar: 0.02, skipBottom: true
        });
      }

      if (!ruinTop) {
        const capY = y0 + height - 0.65;
        // Carved Gothic Capital & Abacus
        builder.addBox(x, capY - 0.25, z, radius * 2.05, 0.55, radius * 2.05, stdColor, { rotY, aoBottom: 0.65, chip: 0.04 });
        builder.addBox(x, capY + 0.25, z, radius * 2.4, 0.52, radius * 2.4, stdColor, { rotY, aoBottom: 0.72, chip: 0.05 });
      }
    }

    /**
     * Builds a true pointed Gothic archway with recessed multi-order voussoirs, extrados molding,
     * spandrel masonry, and optional broken/collapsed crown sections.
     */
    function buildPointedArchSpan(builder, x1, z1, x2, z2, springY, archRise, wallTopY, thickness = 2.2, options = {}) {
      const dx = x2 - x1, dz = z2 - z1;
      const span = Math.hypot(dx, dz);
      const midX = (x1 + x2) * 0.5, midZ = (z1 + z2) * 0.5;
      const rotY = Math.atan2(dx, dz); // local Z aligns from (x1,z1) -> (x2,z2)
      const cosR = Math.cos(rotY), sinR = Math.sin(rotY);

      const clearHalfSpan = (span - (options.pierWidth || 2.2)) * 0.5;
      const segmentsPerSide = options.segments || 11;
      const brokenCrown = options.brokenCrown || false;
      const openSpandrel = options.openSpandrel || false;
      const hasBalustrade = options.balustrade || false;

      const stdColor = (wx, wy, wz, ao) => computeStoneColor(wx, wy, wz, ao, options.moss || 0.1);

      const localToWorld = (lx, ly, lz) => [
        midX + lx * cosR + lz * sinR,
        ly,
        midZ - lx * sinR + lz * cosR
      ];

      // Build left (-1) and right (+1) pointed arch curves
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < segmentsPerSide; i++) {
          const t0 = i / segmentsPerSide;
          const t1 = (i + 1) / segmentsPerSide;
          const tm = (t0 + t1) * 0.5;

          if (brokenCrown && tm > 0.72 && hash3(midX + side * 9, i, midZ) > 0.25) continue;

          // Pointed lancet arch curve parameterization
          const angle = tm * (Math.PI * 0.48);
          const lz = side * clearHalfSpan * Math.cos(angle);
          const ly = springY + archRise * Math.sin(angle);

          // Tangent slope angle in the (lz, ly) plane
          const dLz = -side * clearHalfSpan * Math.sin(angle);
          const dLy = archRise * Math.cos(angle);
          const voussoirPitch = Math.atan2(dLz, dLy) * 0.85;
          const segLen = (Math.hypot(clearHalfSpan, archRise) * 1.35) / segmentsPerSide;

          // Inner recessed soffit order
          const wp = localToWorld(0, ly, lz);
          builder.addBox(wp[0], wp[1], wp[2], thickness * 0.68, segLen, 0.72, stdColor, {
            rotY, rotX: voussoirPitch, aoBottom: 0.65, aoTop: 0.95, chip: 0.04
          });

          // Outer chamfered voussoir order (gives deep recessed profile)
          const lzOuter = side * (clearHalfSpan + 0.55) * Math.cos(angle);
          const lyOuter = springY + (archRise + 0.55) * Math.sin(angle);
          const wpOut = localToWorld(0, lyOuter, lzOuter);
          builder.addBox(wpOut[0], wpOut[1], wpOut[2], thickness * 1.04, segLen * 1.06, 0.82, stdColor, {
            rotY, rotX: voussoirPitch, aoBottom: 0.76, aoTop: 1.0, chip: 0.05
          });

          // Spandrel wall courses above each voussoir up to wallTopY
          if (!openSpandrel) {
            const spandrelStart = lyOuter + 0.55;
            const courseH = 0.88;
            for (let sy = spandrelStart; sy < wallTopY - 0.2; sy += courseH) {
              // Ruin erosion near top
              if (brokenCrown && sy > wallTopY - 2.6 && Math.abs(lzOuter) < clearHalfSpan * 0.55) continue;
              if (sy > wallTopY - 1.1 && hash3(wpOut[0], sy, wpOut[2]) > 0.72) continue;

              const wpSpan = localToWorld(0, sy, lzOuter);
              builder.addBox(wpSpan[0], wpSpan[1], wpSpan[2], thickness * 0.92, courseH, (span / (segmentsPerSide * 1.55)), stdColor, {
                rotY, aoBottom: 0.82, aoTop: 1.0, chip: 0.05, mortar: 0.03
              });
            }
          }
        }
      }

      // Upper cornice & optional Gothic parapet balustrade
      if (!brokenCrown) {
        const corniceBricks = Math.max(6, Math.floor(span / 1.4));
        const brickLen = span / corniceBricks;
        for (let b = 0; b < corniceBricks; b++) {
          const lz = -span * 0.5 + (b + 0.5) * brickLen;
          if (hash3(midX + b, wallTopY, midZ) > 0.91) continue;
          const wp = localToWorld(0, wallTopY, lz);
          builder.addBox(wp[0], wp[1], wp[2], thickness * 1.16, 0.62, brickLen, stdColor, {
            rotY, aoBottom: 0.7, aoTop: 1.05, chip: 0.05
          });

          if (hasBalustrade && b % 2 === 0 && hash3(b * 13, midX, midZ) < 0.82) {
            const wpBal = localToWorld(0, wallTopY + 0.85, lz);
            builder.addBox(wpBal[0], wpBal[1], wpBal[2], thickness * 0.55, 1.15, brickLen * 0.55, stdColor, {
              rotY, aoBottom: 0.75, aoTop: 1.02, chip: 0.04
            });
            const wpRail = localToWorld(0, wallTopY + 1.55, lz);
            builder.addBox(wpRail[0], wpRail[1], wpRail[2], thickness * 0.72, 0.42, brickLen * 1.95, stdColor, {
              rotY, aoBottom: 0.8, aoTop: 1.05, chip: 0.05
            });
          }
        }
      }
    }

    /**
     * Builds a partially submerged, weathered stone staircase with side stringer walls/parapets.
     */
    function buildStoneStaircase(builder, cx, cz, width, stepCount, rotY, startY = -1.1, risePerStep = 0.26, runPerStep = 0.58) {
      stairs.push({center:[cx,cz],width,stepCount,rotY,startY,risePerStep,runPerStep});
      const cosR = Math.cos(rotY), sinR = Math.sin(rotY);
      const stdColor = (wx, wy, wz, ao) => computeStoneColor(wx, wy, wz, ao, 0.22);

      const localToWorld = (lx, ly, lz) => [
        cx + lx * cosR + lz * sinR,
        ly,
        cz - lx * sinR + lz * cosR
      ];

      for (let s = 0; s < stepCount; s++) {
        const sy = startY + s * risePerStep;
        const sz = (s - stepCount * 0.5) * runPerStep;

        // Break every step into 4–6 individual weathered stone slabs
        const slabCount = 5;
        const slabW = width / slabCount;
        for (let k = 0; k < slabCount; k++) {
          if (s > stepCount - 3 && (k === 0 || k === slabCount - 1) && hash3(cx + k, s, cz) > 0.65) continue;
          const lx = -width * 0.5 + (k + 0.5) * slabW;
          const tilt = (hash3(cx + k * 7, s * 11, cz) - 0.5) * 0.06;
          const wp = localToWorld(lx, sy, sz);
          builder.addBox(wp[0], wp[1], wp[2], slabW * 0.96, risePerStep * 1.45, runPerStep * 1.08, stdColor, {
            rotY: rotY + tilt, aoBottom: 0.65, aoTop: 0.98, chip: 0.05, skipBottom: true
          });
        }

        // Low stepped cheek walls / stringers on both sides of the stairs
        for (let side = -1; side <= 1; side += 2) {
          const lx = side * (width * 0.5 + 0.42);
          const wpCheek = localToWorld(lx, sy + 0.35, sz);
          builder.addBox(wpCheek[0], wpCheek[1], wpCheek[2], 0.78, 0.85, runPerStep * 1.06, stdColor, {
            rotY, aoBottom: 0.72, aoTop: 1.02, chip: 0.05, skipBottom: true
          });
        }
      }
    }

    /**
     * Builds a monumental ruined Gothic Bell Tower matching the twin/triple towers in the references,
     * complete with tall pointed belfry openings, internal timber latticework, hanging bronze bell,
     * corner buttresses, and shattered upper pinnacles.
     */
    function buildRuinedBellTower(builder, woodBuilder, cx, cz, baseY, totalHeight, width, rotY = 0, seedOffset = 0) {
      const cosR = Math.cos(rotY), sinR = Math.sin(rotY);
      const stdColor = (wx, wy, wz, ao) => computeStoneColor(wx, wy, wz, ao, 0.12);
      const woodColor = (wx, wy, wz, ao) => {
        _tmpCol.copy(PALETTE.woodBeam).multiplyScalar(ao * (0.85 + 0.3 * hash3(wx, wy, wz)));
        return _tmpCol;
      };
      const bellColor = (wx, wy, wz, ao) => {
        _tmpCol.copy(PALETTE.bellBronze).multiplyScalar(ao);
        return _tmpCol;
      };

      const localToWorld = (lx, ly, lz) => [
        cx + lx * cosR + lz * sinR,
        ly,
        cz - lx * sinR + lz * cosR
      ];

      landmarks.push({type:"bell-tower",center:[cx,baseY,cz],height:totalHeight,width,rotation:rotY});
      const halfW = width * 0.5;
      const belfryFloorY = baseY + totalHeight * 0.54;
      const corniceY = baseY + totalHeight * 0.86;

      // 1. Four thick corner piers & stepped corner buttresses running full height
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [sx, sz] of corners) {
        const pierH = totalHeight - (sx > 0 && sz > 0 ? 1.8 : 0.4);
        const courses = Math.floor(pierH / 1.4);
        for (let c = 0; c < courses; c++) {
          const py = baseY + (c + 0.5) * 1.4;
          const wp = localToWorld(sx * (halfW - 0.85), py, sz * (halfW - 0.85));
          builder.addBox(wp[0], wp[1], wp[2], 2.1, 1.4, 2.1, stdColor, {
            rotY, chip: 0.05, mortar: 0.03, skipBottom: true
          });

          // Exterior stepped corner buttress projections
          if (py < corniceY) {
            const buttOut = py < belfryFloorY ? 0.95 : 0.55;
            const wpB1 = localToWorld(sx * (halfW + buttOut * 0.5), py, sz * (halfW - 0.75));
            builder.addBox(wpB1[0], wpB1[1], wpB1[2], buttOut, 1.4, 1.35, stdColor, { rotY, chip: 0.04, skipBottom: true });
            const wpB2 = localToWorld(sx * (halfW - 0.75), py, sz * (halfW + buttOut * 0.5));
            builder.addBox(wpB2[0], wpB2[1], wpB2[2], 1.35, 1.4, buttOut, stdColor, { rotY, chip: 0.04, skipBottom: true });
          }
        }

        // Ruined corner turret pinnacle at top of tower
        const pinH = 2.6 + hash3(cx + sx, cz + sz, seedOffset) * 2.4;
        const wpPin = localToWorld(sx * (halfW - 0.85), baseY + pierH + pinH * 0.5, sz * (halfW - 0.85));
        builder.addBox(wpPin[0], wpPin[1], wpPin[2], 1.65, pinH, 1.65, stdColor, { rotY, chip: 0.07 });
      }

      // 2. Lower stage masonry & tall lancet niches (4 faces)
      const faceDirs = [
        { nx: 0, nz: 1, fRot: 0 },
        { nx: 0, nz: -1, fRot: Math.PI },
        { nx: 1, nz: 0, fRot: Math.PI * 0.5 },
        { nx: -1, nz: 0, fRot: -Math.PI * 0.5 }
      ];

      for (const face of faceDirs) {
        const fOffset = halfW - 0.75;
        // Lower stage wall up to belfryFloorY with arched window recess
        const p1 = localToWorld(face.nx * fOffset - face.nz * (halfW - 0.6), 0, face.nz * fOffset + face.nx * (halfW - 0.6));
        const p2 = localToWorld(face.nx * fOffset + face.nz * (halfW - 0.6), 0, face.nz * fOffset - face.nx * (halfW - 0.6));

        buildPointedArchSpan(builder, p1[0], p1[2], p2[0], p2[2], baseY + 11.5, 4.2, belfryFloorY, 1.45, {
          pierWidth: 2.2, segments: 8, moss: 0.14
        });

        // Horizontal stringcourse molding at belfry floor
        const wpMolding = localToWorld(face.nx * halfW, belfryFloorY, face.nz * halfW);
        builder.addBox(wpMolding[0], wpMolding[1], wpMolding[2],
          face.nx !== 0 ? 1.8 : width + 0.6,
          0.75,
          face.nz !== 0 ? 1.8 : width + 0.6,
          stdColor, { rotY, chip: 0.05 }
        );

        // Upper Belfry Stage: Tall open pointed archways revealing the bell inside
        const belfrySpringY = corniceY - 4.8;
        buildPointedArchSpan(builder, p1[0], p1[2], p2[0], p2[2], belfrySpringY, 3.8, corniceY, 1.4, {
          pierWidth: 2.3, segments: 9, brokenCrown: (face.nz > 0 && seedOffset > 0), moss: 0.1
        });

        // Internal timber grid / louver frame inside the open belfry window
        const openH = corniceY - belfryFloorY - 2.0;
        for (let v = -1; v <= 1; v++) {
          const wpPost = localToWorld(
            face.nx * (fOffset - 0.35) + face.nz * (v * 1.35),
            belfryFloorY + openH * 0.48,
            face.nz * (fOffset - 0.35) - face.nx * (v * 1.35)
          );
          woodBuilder.addBox(wpPost[0], wpPost[1], wpPost[2], 0.22, openH * 0.9, 0.22, woodColor, { rotY });
        }
        for (let h = 1; h <= 4; h++) {
          const hy = belfryFloorY + h * (openH / 4.8);
          const wpBar = localToWorld(face.nx * (fOffset - 0.35), hy, face.nz * (fOffset - 0.35));
          woodBuilder.addBox(wpBar[0], wpBar[1], wpBar[2],
            face.nx !== 0 ? 0.24 : width * 0.62,
            0.22,
            face.nz !== 0 ? 0.24 : width * 0.62,
            woodColor, { rotY }
          );
        }
      }

      // 3. Heavy Timber Bell Frame & Hanging Bronze Bell inside the belfry
      const bellY = belfryFloorY + (corniceY - belfryFloorY) * 0.52;
      const wpBeam = localToWorld(0, bellY + 2.4, 0);
      woodBuilder.addBox(wpBeam[0], wpBeam[1], wpBeam[2], width * 0.78, 0.55, 0.65, woodColor, { rotY });
      woodBuilder.addBox(wpBeam[0], wpBeam[1], wpBeam[2], 0.65, 0.55, width * 0.78, woodColor, { rotY });

      // Voxelized Bronze Bell Tiers
      const bellTiers = [
        { dy: 1.5, w: 1.2 },
        { dy: 0.8, w: 1.75 },
        { dy: 0.0, w: 2.15 },
        { dy: -0.75, w: 2.75 },
        { dy: -1.35, w: 3.25 }
      ];
      for (const tier of bellTiers) {
        const wpBell = localToWorld(0, bellY + tier.dy, 0);
        woodBuilder.addBox(wpBell[0], wpBell[1], wpBell[2], tier.w, 0.72, tier.w, bellColor, { rotY });
        woodBuilder.addBox(wpBell[0], wpBell[1], wpBell[2], tier.w * 0.92, 0.72, tier.w * 0.92, bellColor, { rotY: rotY + Math.PI * 0.25 });
      }
      // Clapper
      const wpClap = localToWorld(0, bellY - 1.75, 0);
      woodBuilder.addBox(wpClap[0], wpClap[1], wpClap[2], 0.42, 0.65, 0.42, bellColor, { rotY });
    }

    /* ============================================================================
     * 5. CENTRAL SAINT STATUE — HIGH-RESOLUTION VOXELIZED SDF SCULPTURE
     * ============================================================================ */
    function smin(a, b, k = 0.25) {
      const h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return b * (1.0 - h) + a * h - k * h * (1.0 - h);
    }

    function sdCapsule(px, py, pz, ax, ay, az, bx, by, bz, r) {
      const pax = px - ax, pay = py - ay, paz = pz - az;
      const bax = bx - ax, bay = by - ay, baz = bz - az;
      const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz + 1e-6), 0.0, 1.0);
      const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
    }

    function sdEllipsoid(px, py, pz, cx, cy, cz, rx, ry, rz) {
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const dz = (pz - cz) / rz;
      const k0 = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const k1 = Math.sqrt(dx * dx / (rx * rx) + dy * dy / (ry * ry) + dz * dz / (rz * rz));
      return k0 * (k0 - 1.0) / (k1 + 1e-5);
    }

    /**
     * Evaluates the continuous Signed Distance Field (SDF) of the monumental robed saint statue.
     * Local statue coordinates: y = 0 at top of stone pedestal (world y = 4.65) up to y = 18.4 (world y = 23.05).
     * Statue faces +Z (toward the causeway and camera).
     */
    function evalStatueSDF(x, y, z) {
      // 1. Molded Statue Plinth (y = 0.0 .. 1.1)
      const radXZ = Math.hypot(x, z);
      const octR = Math.max(Math.abs(x), Math.abs(z), (Math.abs(x) + Math.abs(z)) * 0.72);
      const dPlinth = Math.max(octR - (2.45 - y * 0.35), Math.abs(y - 0.55) - 0.55);

      // 2. Main Robed Lower Column & Flowing Gown (y = 0.9 .. 12.6)
      const hNorm = clamp((y - 0.9) / 11.8, 0.0, 1.0);
      // Slight contrapposto S-curve
      const swayX = Math.sin(hNorm * Math.PI) * 0.14;
      const swayZ = Math.sin(hNorm * Math.PI * 0.85) * 0.12;
      const lx = x - swayX;
      const lz = z - swayZ;

      // Tapered elliptical torso/gown profile
      const rx = 2.05 - hNorm * 0.42 + Math.sin(hNorm * Math.PI) * 0.25;
      const rz = 1.65 - hNorm * 0.35 + Math.sin(hNorm * Math.PI) * 0.18;
      let dGown = (Math.hypot(lx / rx, lz / rz) - 1.0) * Math.min(rx, rz);
      dGown = Math.max(dGown, Math.abs(y - 6.8) - 5.95);

      // Deep vertical and diagonal carved drapery folds with undercuts
      const angle = Math.atan2(lz, lx);
      const fold1 = Math.sin(angle * 11.0 + Math.sin(y * 0.55) * 1.4) * 0.14;
      const fold2 = Math.cos(angle * 7.0 - y * 0.42) * 0.11;
      // Diagonal mantle cascade across front (+Z) from left shoulder (+X) to right knee (-X)
      const diagWave = Math.sin((lx * 1.45 + y * 0.52) * 2.6) * 0.16 * smoothstep(-0.3, 0.8, lz);
      const deepCrevice = Math.pow(Math.max(0, Math.sin(angle * 5.0 + y * 0.25)), 3.0) * 0.12;

      const foldFade = smoothstep(0.6, 1.8, y) * smoothstep(14.5, 11.5, y);
      dGown -= (fold1 + fold2 + diagWave - deepCrevice) * foldFade;

      // 3. Upper Torso, Broad Draped Shoulders & Heavy Mantle (y = 10.5 .. 14.3)
      const dShoulders = sdEllipsoid(x, y, z, 0.0, 12.65, -0.08, 2.18, 2.15, 1.45);
      // Mantle hood/collar drape around neck and shoulders
      const dCollar = sdEllipsoid(x, y, z, 0.0, 14.05, -0.15, 1.38, 0.85, 1.15);

      let dBody = smin(dPlinth, dGown, 0.22);
      dBody = smin(dBody, dShoulders, 0.45);
      dBody = smin(dBody, dCollar, 0.35);

      // 4. Right Arm (Statue's Right = -X side): Bent at elbow, forearm & hand raised peacefully over chest
      const dRightUpperArm = sdCapsule(x, y, z, -1.75, 13.3, -0.1, -2.05, 10.6, 0.45, 0.62);
      const dRightForearm = sdCapsule(x, y, z, -1.95, 10.5, 0.52, -0.35, 11.85, 1.28, 0.54);
      // Hanging wide sleeve under right elbow
      const dRightSleeve = sdEllipsoid(x, y, z, -1.45, 9.75, 0.42, 0.72, 1.65, 0.75);
      // Sculpted right hand on chest
      const dRightHand = sdEllipsoid(x, y, z, -0.18, 11.95, 1.32, 0.42, 0.32, 0.28);

      // 5. Left Arm (Statue's Left = +X side): Resting downward holding gathered robe folds
      const dLeftUpperArm = sdCapsule(x, y, z, 1.75, 13.3, -0.05, 2.02, 10.2, 0.35, 0.64);
      const dLeftForearm = sdCapsule(x, y, z, 1.98, 10.2, 0.38, 1.15, 8.25, 1.05, 0.58);
      // Heavy vertical cascade of cloak falling from left forearm (seen clearly in all 3 images!)
      const dLeftCloakDrop = sdCapsule(x, y, z, 1.55, 10.0, 0.55, 1.45, 2.2, 0.45, 0.76 + Math.sin(y * 1.2) * 0.09);

      dBody = smin(dBody, dRightUpperArm, 0.25);
      dBody = smin(dBody, dRightForearm, 0.22);
      dBody = smin(dBody, dRightSleeve, 0.32);
      dBody = smin(dBody, dRightHand, 0.14);
      dBody = smin(dBody, dLeftUpperArm, 0.25);
      dBody = smin(dBody, dLeftForearm, 0.25);
      dBody = smin(dBody, dLeftCloakDrop, 0.35);

      // 6. Neck & Solemn Slightly Bowed Head (y = 14.2 .. 17.9)
      const dNeck = sdCapsule(x, y, z, 0.0, 14.0, -0.05, 0.0, 15.1, 0.12, 0.68);

      // Tilt head slightly downward (pitch forward ~11 deg) and slightly toward right (-x)
      const hx = x + 0.05;
      const hy0 = y - 16.25;
      const hz0 = z - 0.26;
      const pitch = 0.19;
      const hy = hy0 * Math.cos(pitch) + hz0 * Math.sin(pitch);
      const hz = -hy0 * Math.sin(pitch) + hz0 * Math.cos(pitch);

      // Cranium & Jaw
      let dHead = sdEllipsoid(hx, hy, hz, 0.0, 0.15, 0.0, 0.96, 1.32, 1.08);
      const dJaw = sdEllipsoid(hx, hy, hz, 0.0, -0.62, 0.28, 0.68, 0.72, 0.75);
      dHead = smin(dHead, dJaw, 0.25);

      // Facial Anatomy: Brow ridge, recessed eye sockets, nose bridge, cheekbones, beard/chin contour
      const dBrow = sdEllipsoid(hx, hy, hz, 0.0, 0.32, 0.88, 0.66, 0.18, 0.32);
      const dNose = sdCapsule(hx, hy, hz, 0.0, 0.28, 0.96, 0.0, -0.22, 1.16, 0.16);
      const dCheekL = sdEllipsoid(hx, hy, hz, 0.42, -0.08, 0.78, 0.28, 0.26, 0.28);
      const dCheekR = sdEllipsoid(hx, hy, hz, -0.42, -0.08, 0.78, 0.28, 0.26, 0.28);
      const dLips = sdEllipsoid(hx, hy, hz, 0.0, -0.52, 0.92, 0.28, 0.14, 0.22);
      const dChinBeard = sdEllipsoid(hx, hy, hz, 0.0, -0.88, 0.62, 0.48, 0.56, 0.48);

      dHead = smin(dHead, dBrow, 0.12);
      dHead = smin(dHead, dNose, 0.09);
      dHead = smin(dHead, dCheekL, 0.15);
      dHead = smin(dHead, dCheekR, 0.15);
      dHead = smin(dHead, dLips, 0.1);
      dHead = smin(dHead, dChinBeard, 0.18);

      // Carve recessed eye sockets
      const dEyeL = sdEllipsoid(hx, hy, hz, 0.34, 0.14, 0.92, 0.21, 0.15, 0.22);
      const dEyeR = sdEllipsoid(hx, hy, hz, -0.34, 0.14, 0.92, 0.21, 0.15, 0.22);
      dHead = Math.max(dHead, -dEyeL * 0.75);
      dHead = Math.max(dHead, -dEyeR * 0.75);

      // Long flowing wavy hair / veil framing the face and falling onto the shoulders
      const hairWave = Math.sin(y * 3.8 + x * 4.0) * 0.06;
      const dHairCrown = sdEllipsoid(hx, hy, hz, 0.0, 0.28, -0.14, 1.14 + hairWave, 1.38, 1.18);
      const dHairSideL = sdCapsule(x, y, z, 0.85, 16.5, 0.05, 1.18, 13.7, 0.22, 0.44 + hairWave);
      const dHairSideR = sdCapsule(x, y, z, -0.85, 16.5, 0.05, -1.18, 13.7, 0.22, 0.44 - hairWave);
      const dHairBack = sdEllipsoid(x, y, z, 0.0, 15.1, -0.58, 1.15, 1.75, 0.65);

      dHead = smin(dHead, dHairCrown, 0.18);
      dHead = smin(dHead, dHairSideL, 0.22);
      dHead = smin(dHead, dHairSideR, 0.22);
      dHead = smin(dHead, dHairBack, 0.25);

      let dTotal = smin(dBody, dNeck, 0.25);
      dTotal = smin(dTotal, dHead, 0.2);

      // Subtle weathered stone erosion & micro-cracks
      const erosion = (noise3D(x * 2.4, y * 2.4, z * 2.4) - 0.45) * 0.045;
      return dTotal + erosion;
    }

    /**
     * Generates the multi-tiered octagonal stone pedestal + high-resolution voxelized Saint Statue.
     */
    function buildCentralStatueAndPedestal(stoneBuilder, foliageInstances) {
      const pedBaseY = -0.8;
      const pedTopY = 4.65;

      // 1. Multi-tiered Octagonal/Square Pedestal (world y = -0.8 to 4.65)
      const pedColor = (wx, wy, wz, ao) => computeStoneColor(wx, wy, wz, ao, 0.35, true);
      const tiers = [
        { y: -0.2, h: 1.2, w: 8.6 },
        { y: 0.75, h: 0.9, w: 7.6 },
        { y: 2.25, h: 2.3, w: 6.4 }, // Main paneled die of pedestal
        { y: 3.75, h: 0.75, w: 7.2 }, // Projecting cornice
        { y: 4.35, h: 0.6, w: 6.0 }   // Upper plinth
      ];

      for (const tier of tiers) {
        const subBlocks = 5;
        const step = tier.w / subBlocks;
        for (let ix = 0; ix < subBlocks; ix++) {
          for (let iz = 0; iz < subBlocks; iz++) {
            // Only perimeter blocks
            if (ix > 0 && ix < subBlocks - 1 && iz > 0 && iz < subBlocks - 1 && tier.y < 4.0) continue;
            const bx = -tier.w * 0.5 + (ix + 0.5) * step;
            const bz = -tier.w * 0.5 + (iz + 0.5) * step;
            stoneBuilder.addBox(bx, tier.y, bz, step * 0.98, tier.h, step * 0.98, pedColor, {
              aoBottom: 0.65, aoTop: 1.0, chip: 0.06, mortar: 0.025, skipBottom: true
            });
            // Octagonal rotation overlay for chamfered monumental look
            stoneBuilder.addBox(bx * 0.92, tier.y, bz * 0.92, step * 0.92, tier.h * 0.98, step * 0.92, pedColor, {
              rotY: Math.PI * 0.25, aoBottom: 0.68, aoTop: 0.98, chip: 0.05, skipBottom: true
            });
          }
        }
      }

      // 2. High-Resolution Voxelization of the Saint Statue SDF ( ~3.5x finer resolution: voxel step = 0.165 )
      const vStep = 0.165;
      const nx = Math.ceil(5.4 / vStep);
      const ny = Math.ceil(18.5 / vStep);
      const nz = Math.ceil(4.6 / vStep);
      const x0 = -2.7, y0 = 0.0, z0 = -2.3;

      // Sample SDF grid
      const strideZ = 1;
      const strideX = nz;
      const strideY = nx * nz;
      const solidGrid = new Uint8Array(nx * ny * nz);

      for (let iy = 0; iy < ny; iy++) {
        const ly = y0 + iy * vStep;
        for (let ix = 0; ix < nx; ix++) {
          const lx = x0 + ix * vStep;
          for (let iz = 0; iz < nz; iz++) {
            const lz = z0 + iz * vStep;
            if (evalStatueSDF(lx, ly, lz) <= 0.0) {
              solidGrid[iy * strideY + ix * strideX + iz] = 1;
            }
          }
        }
      }

      const isSolid = (ix, iy, iz) => {
        if (ix < 0 || ix >= nx || iy < 0 || iy >= ny || iz < 0 || iz >= nz) return false;
        return solidGrid[iy * strideY + ix * strideX + iz] === 1;
      };

      // Compute analytical SDF gradient normal for smooth sculptural shading on beveled voxel faces
      const evalNormal = (lx, ly, lz) => {
        const eps = 0.12;
        const dx = evalStatueSDF(lx + eps, ly, lz) - evalStatueSDF(lx - eps, ly, lz);
        const dy = evalStatueSDF(lx, ly + eps, lz) - evalStatueSDF(lx, ly - eps, lz);
        const dz = evalStatueSDF(lx, ly, lz + eps) - evalStatueSDF(lx, ly, lz - eps);
        const len = Math.hypot(dx, dy, dz) || 1.0;
        return [dx / len, dy / len, dz / len];
      };

      const statueBuilder = new VoxelBatchBuilder();
      const hs = vStep * 0.51;

      const faceDefs = [
        { dir: [1, 0, 0], corners: [[hs, -hs, hs], [hs, -hs, -hs], [hs, hs, -hs], [hs, hs, hs]] },
        { dir: [-1, 0, 0], corners: [[-hs, -hs, -hs], [-hs, -hs, hs], [-hs, hs, hs], [-hs, hs, -hs]] },
        { dir: [0, 1, 0], corners: [[-hs, hs, hs], [hs, hs, hs], [hs, hs, -hs], [-hs, hs, -hs]] },
        { dir: [0, -1, 0], corners: [[-hs, -hs, -hs], [hs, -hs, -hs], [hs, -hs, hs], [-hs, -hs, hs]] },
        { dir: [0, 0, 1], corners: [[-hs, -hs, hs], [hs, -hs, hs], [hs, hs, hs], [-hs, hs, hs]] },
        { dir: [0, 0, -1], corners: [[hs, -hs, -hs], [-hs, -hs, -hs], [-hs, hs, -hs], [hs, hs, -hs]] }
      ];

      for (let iy = 0; iy < ny; iy++) {
        const ly = y0 + iy * vStep;
        const wy = pedTopY + ly;
        for (let ix = 0; ix < nx; ix++) {
          const lx = x0 + ix * vStep;
          const wx = lx;
          for (let iz = 0; iz < nz; iz++) {
            if (!isSolid(ix, iy, iz)) continue;

            // Check exposed faces
            let exposedMask = 0;
            if (!isSolid(ix + 1, iy, iz)) exposedMask |= 1;
            if (!isSolid(ix - 1, iy, iz)) exposedMask |= 2;
            if (!isSolid(ix, iy + 1, iz)) exposedMask |= 4;
            if (!isSolid(ix, iy - 1, iz)) exposedMask |= 8;
            if (!isSolid(ix, iy, iz + 1)) exposedMask |= 16;
            if (!isSolid(ix, iy, iz - 1)) exposedMask |= 32;
            if (exposedMask === 0) continue;

            const lz = z0 + iz * vStep;
            const wz = lz;
            const sdfNorm = evalNormal(lx, ly, lz);

            // Neighbourhood 27-voxel cavity AO
            let solidNeighbors = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                  if (isSolid(ix + dx, iy + dy, iz + dz)) solidNeighbors++;
                }
              }
            }
            const cavityAO = clamp(1.18 - (solidNeighbors / 27.0) * 0.68, 0.38, 1.05);

            // Moss on left shoulder (+X), lower robe skirt, and upward-facing ledges
            const isLeftCloak = (lx > 0.35 && lz > -0.2);
            const upwardFactor = Math.max(0, sdfNorm[1]);
            const mossWeight = (isLeftCloak ? 0.35 : 0.05) + upwardFactor * 0.42 + (ly < 2.5 ? 0.38 : 0.0);

            // Spawn hanging ivy & moss clumps on statue's left shoulder, chest crease, and base
            if ((exposedMask & 4) && mossWeight > 0.46 && hash3(ix * 11, iy * 17, iz * 23) > 0.72) {
              foliageInstances.push({ x: wx, y: wy, z: wz, scale: 0.38, type: 'moss' });
            }

            for (let f = 0; f < 6; f++) {
              if (!(exposedMask & (1 << f))) continue;
              const fd = faceDefs[f];
              // Blend voxel face normal (45%) with sculptural SDF normal (55%) so voxel bevels and drapery curves both read crisply
              let nxMix = fd.dir[0] * 0.45 + sdfNorm[0] * 0.55;
              let nyMix = fd.dir[1] * 0.45 + sdfNorm[1] * 0.55;
              let nzMix = fd.dir[2] * 0.45 + sdfNorm[2] * 0.55;
              const nLen = Math.hypot(nxMix, nyMix, nzMix) || 1.0;
              nxMix /= nLen; nyMix /= nLen; nzMix /= nLen;

              const baseIdx = statueBuilder.vertexCount;
              const col = computeStoneColor(wx, wy, wz, cavityAO, mossWeight, true);

              for (let k = 0; k < 4; k++) {
                const c = fd.corners[k];
                statueBuilder.positions.push(wx + c[0], wy + c[1], wz + c[2]);
                statueBuilder.normals.push(nxMix, nyMix, nzMix);
                statueBuilder.colors.push(col.r, col.g, col.b);
              }
              statueBuilder.indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
              statueBuilder.vertexCount += 4;
            }
          }
        }
      }

      // Add lush moss & ivy collar around the top of the pedestal base (as seen in all 3 images)
      for (let a = 0; a < 44; a++) {
        const ang = (a / 44) * Math.PI * 2;
        const r = 2.85 + (hash3(a, 1, 2) - 0.5) * 0.6;
        const mx = Math.cos(ang) * r;
        const mz = Math.sin(ang) * r;
        foliageInstances.push({ x: mx, y: pedTopY - 0.15, z: mz, scale: 0.75 + hash3(a, 3, 4) * 0.45, type: 'ivy' });
        if (a % 2 === 0) {
          foliageInstances.push({ x: mx * 1.08, y: pedTopY - 0.85, z: mz * 1.08, scale: 0.65, type: 'ivy' });
        }
      }

      return statueBuilder.toBufferGeometry();
    }

    /* ============================================================================
     * 6. ANCIENT INVADING TREE ROOTS (SWEPT VOXEL-BARK TUBULAR STRUCTURES)
     * ============================================================================ */
    function addRootBranch(rootBuilder, controlPts, rStart, rEnd, steps = 28, twistTurns = 1.5) {
      const curve = new THREE.CatmullRomCurve3(controlPts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
      const radialSegs = 7;

      const ringVertices = [];
      const up = new THREE.Vector3(0, 1, 0);
      const tangent = new THREE.Vector3();
      const normal = new THREE.Vector3();
      const binormal = new THREE.Vector3();

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const pt = curve.getPoint(t);
        curve.getTangent(t, tangent);

        if (Math.abs(tangent.y) > 0.92) {
          normal.set(1, 0, 0).cross(tangent).normalize();
        } else {
          normal.crossVectors(up, tangent).normalize();
        }
        binormal.crossVectors(tangent, normal).normalize();

        const baseR = rStart * Math.pow(Math.max(0.08, rEnd / rStart), t);
        const ring = [];

        for (let j = 0; j < radialSegs; j++) {
          const theta = (j / radialSegs) * Math.PI * 2 + t * twistTurns * Math.PI * 2;
          // Bark ridge & voxel-stepped furrow modulation
          const ridge = 1.0 + 0.24 * Math.sin(j * 3.0 + t * 14.0) + 0.12 * (hash3(pt.x * 3 + j, pt.y * 3, pt.z * 3) - 0.5);
          const r = baseR * ridge;

          const vx = pt.x + (normal.x * Math.cos(theta) + binormal.x * Math.sin(theta)) * r;
          const vy = pt.y + (normal.y * Math.cos(theta) + binormal.y * Math.sin(theta)) * r;
          const vz = pt.z + (normal.z * Math.cos(theta) + binormal.z * Math.sin(theta)) * r;

          const nx = normal.x * Math.cos(theta) + binormal.x * Math.sin(theta);
          const ny = normal.y * Math.cos(theta) + binormal.y * Math.sin(theta);
          const nz = normal.z * Math.cos(theta) + binormal.z * Math.sin(theta);

          ring.push({ x: vx, y: vy, z: vz, nx, ny, nz });
        }
        ringVertices.push(ring);
      }

      // Build stepped bark quads between rings
      for (let i = 0; i < steps; i++) {
        const r0 = ringVertices[i];
        const r1 = ringVertices[i + 1];
        for (let j = 0; j < radialSegs; j++) {
          const jNext = (j + 1) % radialSegs;
          const v00 = r0[j], v10 = r0[jNext], v11 = r1[jNext], v01 = r1[j];

          const baseIdx = rootBuilder.vertexCount;
          const verts = [v00, v10, v11, v01];

          for (let k = 0; k < 4; k++) {
            const v = verts[k];
            rootBuilder.positions.push(v.x, v.y, v.z);
            rootBuilder.normals.push(v.nx, v.ny, v.nz);

            // Root bark color: golden-ochre lichen on sunlit upper-right surfaces, dark brown in crevices & near water
            const sunDot = clamp(v.nx * 0.55 + v.ny * 0.65 - v.nz * 0.25, 0, 1);
            const barkNoise = fbm3(v.x * 0.45, v.y * 0.45, v.z * 0.45, 2);
            _tmpCol.copy(PALETTE.rootDark).lerp(PALETTE.rootMid, barkNoise);
            if (sunDot > 0.25 && v.y > 1.2) {
              _tmpCol.lerp(PALETTE.rootGold, clamp((sunDot - 0.25) * 1.35 * barkNoise, 0, 0.85));
            }
            if (v.y < 1.8) {
              _tmpCol.lerp(PALETTE.darkGranite, smoothstep(1.8, -0.3, v.y) * 0.65);
            }
            rootBuilder.colors.push(_tmpCol.r, _tmpCol.g, _tmpCol.b);
          }

          rootBuilder.indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
          rootBuilder.vertexCount += 4;
        }
      }
    }

    function buildAllRootSystems() {
      const rootBuilder = new VoxelBatchBuilder();

      // 1. LEFT FOREGROUND ARCHWAY & PIER ROOTS (Prominent on far left of View 1 & View 3)
      const leftFgRoots = [
        { pts: [[-18.2, 23.5, 26.5], [-17.4, 17.5, 25.8], [-16.8, 11.2, 24.5], [-15.2, 5.2, 22.8], [-12.5, -0.6, 21.5]], r0: 0.95, r1: 0.18 },
        { pts: [[-18.0, 21.0, 26.2], [-18.8, 14.5, 27.2], [-17.5, 7.8, 28.0], [-16.2, 2.5, 28.8], [-15.4, -0.6, 29.8]], r0: 0.82, r1: 0.16 },
        { pts: [[-17.2, 14.2, 25.2], [-15.5, 9.8, 23.2], [-13.2, 6.2, 20.5], [-10.8, 2.8, 18.8], [-9.2, -0.5, 17.5]], r0: 0.58, r1: 0.12 },
        { pts: [[-18.2, 16.5, 26.5], [-20.2, 11.0, 26.0], [-21.5, 5.5, 24.5], [-22.8, -0.6, 23.0]], r0: 0.65, r1: 0.15 },
        { pts: [[-16.8, 11.2, 24.5], [-14.2, 7.5, 25.5], [-11.8, 3.2, 26.2], [-10.5, -0.5, 27.0]], r0: 0.45, r1: 0.1 }
      ];

      // 2. LEFT BALCONY GALLERY ROOTS (Framing foreground of View 2 & outer left tower of View 3)
      const leftBalconyRoots = [
        { pts: [[-25.5, 26.0, 18.5], [-24.5, 19.5, 17.5], [-22.8, 12.0, 15.2], [-20.2, 5.5, 13.5], [-17.5, -0.6, 12.0]], r0: 0.92, r1: 0.18 },
        { pts: [[-25.8, 24.0, 20.5], [-26.2, 16.5, 22.0], [-24.8, 11.2, 24.2], [-22.5, 9.2, 26.5], [-20.2, 7.8, 28.2]], r0: 0.68, r1: 0.15 },
        { pts: [[-21.2, 11.5, 28.5], [-20.0, 9.8, 26.2], [-18.8, 8.6, 23.5], [-18.2, 6.5, 21.0]], r0: 0.48, r1: 0.12 },
        { pts: [[-26.5, 10.5, 27.5], [-25.2, 9.2, 25.5], [-23.8, 7.5, 23.8], [-22.5, 3.5, 22.5], [-21.5, -0.5, 21.5]], r0: 0.55, r1: 0.14 }
      ];

      // 3. LEFT-MID ARCADE & BELL TOWER COLOSSAL ROOT CASCADE (Center-left in View 1, View 2, View 3)
      const leftMidRoots = [
        { pts: [[-19.5, 22.5, -14.0], [-18.2, 19.5, -8.5], [-18.0, 15.5, -4.2], [-16.5, 9.5, -1.5], [-14.2, 3.8, 1.5], [-11.8, -0.6, 4.2]], r0: 1.15, r1: 0.22 },
        { pts: [[-18.2, 19.5, -8.5], [-17.5, 14.0, -9.8], [-15.2, 8.2, -10.5], [-12.5, 3.5, -10.2], [-9.8, -0.6, -9.5]], r0: 0.95, r1: 0.18 },
        { pts: [[-18.0, 15.5, -4.2], [-19.8, 10.2, -2.5], [-21.2, 4.8, 0.2], [-22.0, -0.6, 2.5]], r0: 0.78, r1: 0.16 },
        { pts: [[-17.5, 14.0, -9.8], [-13.8, 9.5, -6.5], [-10.5, 5.2, -4.2], [-7.8, 1.5, -2.5], [-6.5, -0.6, -1.5]], r0: 0.72, r1: 0.14 },
        { pts: [[-16.5, 9.5, -1.5], [-13.5, 6.2, 2.5], [-11.0, 2.8, 5.8], [-9.2, -0.5, 7.8]], r0: 0.58, r1: 0.12 },
        { pts: [[-19.5, 21.0, -16.5], [-16.2, 16.5, -17.5], [-13.5, 10.5, -16.8], [-10.8, 4.5, -15.5], [-8.5, -0.6, -14.2]], r0: 0.85, r1: 0.16 },
        { pts: [[-15.2, 8.2, -10.5], [-16.8, 4.2, -13.2], [-17.8, -0.5, -15.0]], r0: 0.52, r1: 0.12 }
      ];

      // 4. RIGHT-REAR BELL TOWER ROOT NETWORK (Behind right side of statue in View 1, View 2, View 3)
      const rightRearRoots = [
        { pts: [[18.5, 22.0, -16.5], [16.2, 17.5, -14.2], [14.5, 11.8, -11.5], [12.2, 5.8, -9.2], [9.8, -0.6, -7.5]], r0: 1.05, r1: 0.2 },
        { pts: [[16.2, 17.5, -14.2], [18.2, 12.2, -9.5], [19.5, 6.5, -6.2], [20.5, -0.6, -3.5]], r0: 0.85, r1: 0.16 },
        { pts: [[18.2, 12.2, -9.5], [15.5, 7.5, -6.5], [13.2, 3.2, -4.0], [11.5, -0.6, -2.2]], r0: 0.64, r1: 0.13 },
        { pts: [[14.5, 11.8, -11.5], [11.2, 7.5, -13.5], [8.8, 3.0, -14.8], [7.2, -0.6, -15.5]], r0: 0.56, r1: 0.12 }
      ];

      // 5. RIGHT FOREGROUND PIER & STAIRCASE ROOTS (Prominent on right foreground of View 1, View 2, View 3)
      const rightFgRoots = [
        { pts: [[19.5, 22.5, 14.5], [18.2, 15.5, 15.2], [16.8, 9.2, 15.8], [13.5, 4.5, 15.2], [9.8, 1.2, 14.5], [7.2, -0.6, 13.8]], r0: 1.08, r1: 0.18 },
        { pts: [[18.2, 15.5, 15.2], [19.2, 10.2, 18.5], [17.8, 5.5, 20.5], [15.5, 1.8, 21.8], [13.8, -0.6, 22.8]], r0: 0.86, r1: 0.16 },
        { pts: [[16.8, 9.2, 15.8], [14.5, 6.2, 18.2], [11.8, 2.8, 19.5], [9.2, -0.5, 20.5]], r0: 0.65, r1: 0.13 },
        { pts: [[24.5, 26.5, 2.5], [22.8, 19.5, 5.8], [20.5, 12.5, 8.5], [17.8, 5.8, 10.5], [15.2, -0.6, 11.8]], r0: 0.95, r1: 0.18 }
      ];

      const allRootSets = [...leftFgRoots, ...leftBalconyRoots, ...leftMidRoots, ...rightRearRoots, ...rightFgRoots];
      for (const r of allRootSets) {
        addRootBranch(rootBuilder, r.pts, r.r0, r.r1, 26, 1.35);
      }

      return rootBuilder.toBufferGeometry();
    }

    /* ============================================================================
     * 7. MAIN GOTHIC SANCTUARY ARCHITECTURE, CAUSEWAY, CLIFFS & RUBBLE
     * ============================================================================ */
    function buildSanctuaryArchitecture(foliageInstances) {
      const stoneBuilder = new VoxelBatchBuilder();
      const woodBuilder = new VoxelBatchBuilder();
      const cliffBuilder = new VoxelBatchBuilder();

      const stdColor = (wx, wy, wz, ao) => computeStoneColor(wx, wy, wz, ao, 0.12);
      const causewayColor = (wx, wy, wz, ao) => computeStoneColor(wx, wy, wz, ao, 0.28);
      const cliffColor = (wx, wy, wz, ao) => {
        const n = fbm3(wx * 0.12, wy * 0.22, wz * 0.12, 3);
        _tmpCol.copy(PALETTE.erodedSandstone).lerp(PALETTE.darkGranite, clamp(1.0 - n * 1.3, 0, 0.85));
        if (wy < 2.2) _tmpCol.lerp(PALETTE.wetStone, smoothstep(2.2, -0.5, wy) * 0.8);
        if (wy > 6.0 && n > 0.52) _tmpCol.lerp(PALETTE.darkMoss, 0.45);
        return _tmpCol.multiplyScalar(ao);
      };

      // -------------------------------------------------------------------------
      // A. CENTRAL FOREGROUND CAUSEWAY & CIRCULAR BASIN RING (Matches Views 1,2,3)
      // -------------------------------------------------------------------------
      // 1. Circular Submerged Curb Ring around the central statue basin (center = [0, -0.02, 3.2], radius = 13.8)
      const ringSegments = 52;
      const ringCenterZ = 3.2;
      const ringRadius = 13.8;
      for (let i = 0; i < ringSegments; i++) {
        const ang = (i / ringSegments) * Math.PI * 2;
        const rx = Math.cos(ang) * ringRadius;
        const rz = ringCenterZ + Math.sin(ang) * ringRadius;
        // Skip small gap where causeway meets the ring at front (+Z)
        if (rz > 16.4 && Math.abs(rx) < 2.2) continue;

        const ry = (rz > 5.0) ? 0.08 : -0.04; // Barely skimming the water surface
        stoneBuilder.addBox(rx, ry - 0.35, rz, 1.35, 0.78, 1.75, causewayColor, {
          rotY: -ang, aoBottom: 0.6, aoTop: 0.98, chip: 0.05, skipBottom: true
        });
      }

      // 2. Inner Dry Causeway Platform (z = 16.8 to 25.8, where the Lone Adventurer stands at z = 20.8)
      const cwWidth = 4.6;
      for (let z = 16.8; z <= 25.8; z += 1.05) {
        // Raised edge curbs on left (-X) and right (+X)
        for (let side = -1; side <= 1; side += 2) {
          stoneBuilder.addBox(side * (cwWidth * 0.5 - 0.32), 0.12, z, 0.68, 0.68, 0.98, causewayColor, {
            aoBottom: 0.65, aoTop: 1.02, chip: 0.05, skipBottom: true
          });
        }
        // 4 interior weathered paving slabs per row
        for (let ix = 0; ix < 4; ix++) {
          const sx = -1.45 + ix * 0.96;
          const sy = 0.08 + (hash3(ix * 7, 1, z * 13) - 0.5) * 0.06;
          stoneBuilder.addBox(sx, sy, z, 0.92, 0.58, 0.98, causewayColor, {
            aoBottom: 0.7, aoTop: 1.0, chip: 0.04, mortar: 0.04, skipBottom: true
          });
        }
      }

      // 3. Submerged Stepped Causeway Dip (z = 26.0 to 34.0 — clearly visible under shallow dark water in View 1 & View 2!)
      for (let z = 26.2; z <= 33.8; z += 0.95) {
        const depthProfile = Math.sin(((z - 26.0) / 8.0) * Math.PI);
        const subY = -0.05 - depthProfile * 0.42;

        for (let side = -1; side <= 1; side += 2) {
          stoneBuilder.addBox(side * (cwWidth * 0.5 - 0.32), subY + 0.06, z, 0.68, 0.62, 0.92, causewayColor, {
            aoBottom: 0.55, aoTop: 0.88, chip: 0.05, skipBottom: true
          });
        }
        for (let ix = 0; ix < 4; ix++) {
          const sx = -1.45 + ix * 0.96;
          stoneBuilder.addBox(sx, subY, z, 0.92, 0.52, 0.9, causewayColor, {
            aoBottom: 0.55, aoTop: 0.85, chip: 0.04, mortar: 0.035, skipBottom: true
          });
        }
      }

      // 4. Outer Foreground Causeway Stretch (z = 34.0 to 62.0 — visible in View 3 & extending under camera in View 1)
      for (let z = 34.2; z <= 62.0; z += 1.15) {
        const isOuterDip = z > 55.0;
        const baseY = isOuterDip ? -0.08 - (z - 55.0) * 0.09 : 0.1;

        for (let side = -1; side <= 1; side += 2) {
          stoneBuilder.addBox(side * (cwWidth * 0.5 - 0.32), baseY + 0.04, z, 0.68, 0.68, 1.08, causewayColor, {
            aoBottom: 0.65, aoTop: 1.0, chip: 0.05, skipBottom: true
          });
        }
        for (let ix = 0; ix < 4; ix++) {
          const sx = -1.45 + ix * 0.96;
          stoneBuilder.addBox(sx, baseY, z, 0.92, 0.58, 1.08, causewayColor, {
            aoBottom: 0.7, aoTop: 0.98, chip: 0.05, mortar: 0.04, skipBottom: true
          });
        }
      }

      // -------------------------------------------------------------------------
      // B. SUBMERGED COURTYARD STAIRCASES & FOREGROUND SARCOPHAGI
      // -------------------------------------------------------------------------
      // Left-front staircase (x = -14.8, z = 14.5)
      buildStoneStaircase(stoneBuilder, -14.8, 14.5, 5.4, 9, -Math.PI * 0.36, -0.95, 0.25, 0.56);
      // Left-mid staircase (x = -15.5, z = 1.2)
      buildStoneStaircase(stoneBuilder, -15.5, 1.2, 5.8, 10, -Math.PI * 0.48, -0.95, 0.25, 0.56);
      // Back-left staircase (x = -6.8, z = -14.2)
      buildStoneStaircase(stoneBuilder, -6.8, -14.2, 5.6, 9, -Math.PI * 0.85, -0.95, 0.24, 0.56);
      // Right-mid staircase (x = 16.5, z = -1.5)
      buildStoneStaircase(stoneBuilder, 16.5, -1.5, 6.2, 10, Math.PI * 0.52, -0.95, 0.25, 0.56);
      // Right-front staircase wrapped in roots (x = 12.8, z = 15.8)
      buildStoneStaircase(stoneBuilder, 12.8, 15.8, 6.0, 10, Math.PI * 0.34, -0.95, 0.26, 0.58);

      // Left foreground stone sarcophagus / altar block in shallow water (prominent at bottom-left of View 1 & View 2)
      stoneBuilder.addBox(-9.5, 0.15, 21.8, 2.6, 1.2, 4.4, causewayColor, { rotY: 0.14, chip: 0.06, skipBottom: true });
      stoneBuilder.addBox(-9.5, 0.88, 21.8, 2.85, 0.42, 4.65, causewayColor, { rotY: 0.14, chip: 0.07 });
      foliageInstances.push({ x: -9.5, y: 1.12, z: 21.8, scale: 0.75, type: 'moss' });

      // Additional submerged stairs & broken masonry blocks in outer courtyard (seen in View 3)
      buildStoneStaircase(stoneBuilder, 6.5, 42.0, 4.6, 7, Math.PI * 0.22, -0.85, 0.22, 0.52);
      stoneBuilder.addBox(-19.5, 0.12, 41.5, 2.4, 1.1, 4.8, causewayColor, { rotY: 0.35, chip: 0.06, skipBottom: true });
      stoneBuilder.addBox(-14.2, -0.15, 29.5, 3.2, 1.0, 2.2, causewayColor, { rotY: -0.25, rotZ: 0.12, chip: 0.06, skipBottom: true });

      // -------------------------------------------------------------------------
      // C. LEFT GOTHIC ARCADE & ELEVATED FOREGROUND BALCONY (Hero Left & View 2)
      // -------------------------------------------------------------------------
      const leftArcadePiers = [
        [-18.2, 26.5],
        [-18.2, 13.5],
        [-18.2, 0.5],
        [-18.2, -12.5]
      ];
      for (let i = 0; i < leftArcadePiers.length; i++) {
        const [px, pz] = leftArcadePiers[i];
        buildClusteredPier(stoneBuilder, px, -1.0, pz, 17.2, 1.38, 0, false);
        if (i < leftArcadePiers.length - 1) {
          const [nx, nz] = leftArcadePiers[i + 1];
          buildPointedArchSpan(stoneBuilder, px, pz, nx, nz, 15.8, 5.2, 22.8, 2.25, {
            pierWidth: 2.5, segments: 11, brokenCrown: (i === 2), balustrade: (i === 2), moss: 0.16
          });
        }
      }

      // Elevated Left Foreground Balcony & Monumental Pointed Archway (Camera 2 stands right inside here!)
      // Outer piers of the left gallery at x = -27.2, z = 28.5 and z = 16.5
      buildClusteredPier(stoneBuilder, -27.2, -1.0, 28.5, 21.5, 1.48, 0, false);
      buildClusteredPier(stoneBuilder, -27.2, -1.0, 16.5, 21.5, 1.48, 0, false);
      buildClusteredPier(stoneBuilder, -19.2, -1.0, 28.5, 21.5, 1.45, 0, false);

      // Lower supporting vaulted arches beneath the balcony floor (y = 8.4)
      buildPointedArchSpan(stoneBuilder, -27.2, 28.5, -19.2, 28.5, 4.2, 3.2, 8.6, 2.1, { pierWidth: 2.2, segments: 8 });
      buildPointedArchSpan(stoneBuilder, -27.2, 16.5, -18.2, 13.5, 4.2, 3.2, 8.6, 2.1, { pierWidth: 2.2, segments: 8 });
      buildPointedArchSpan(stoneBuilder, -27.2, 28.5, -27.2, 16.5, 4.2, 3.5, 8.6, 2.1, { pierWidth: 2.2, segments: 9 });

      // Balcony stone slab floor at y = 8.5 (x = -27.2..-19.2, z = 16.5..28.5)
      for (let bx = -26.5; bx <= -19.5; bx += 1.4) {
        for (let bz = 17.2; bz <= 27.8; bz += 1.4) {
          stoneBuilder.addBox(bx, 8.45, bz, 1.36, 0.65, 1.36, causewayColor, {
            aoBottom: 0.6, aoTop: 0.98, chip: 0.05, mortar: 0.035
          });
        }
      }

      // Balcony Carved Gothic Balustrade / Railing overlooking the courtyard (x = -19.2, z = 16.5..27.5)
      // Matches the foreground stone balustrade in View 2!
      for (let bz = 17.2; bz <= 27.2; bz += 1.35) {
        // Plinth rail
        stoneBuilder.addBox(-19.2, 9.0, bz, 0.95, 0.48, 1.32, stdColor, { chip: 0.04 });
        // Mini arched balusters
        stoneBuilder.addBox(-19.2, 9.75, bz - 0.35, 0.54, 1.22, 0.44, stdColor, { chip: 0.04 });
        stoneBuilder.addBox(-19.2, 9.75, bz + 0.35, 0.54, 1.22, 0.44, stdColor, { chip: 0.04 });
        stoneBuilder.addBox(-19.2, 10.48, bz, 1.08, 0.32, 1.28, stdColor, { chip: 0.035 });
      }

      // The gallery's huge silhouette: deep archways, ribbed vault and partially collapsed parapet.
      buildPointedArchSpan(stoneBuilder, -27.2, 16.5, -27.2, 28.5, 18.2, 6.0, 27.0, 2.2, {
        segments: 14, pierWidth: 2.3, brokenCrown: true, openSpandrel: true, moss: 0.27
      });
      buildPointedArchSpan(stoneBuilder, -27.2, 28.5, -19.2, 28.5, 18.2, 4.5, 24.0, 1.9, {
        segments: 10, pierWidth: 2.2, brokenCrown: true, moss: 0.28
      });
      for (let i = 0; i < 9; i++) {
        const bz = 16.8 + i * 1.35;
        stoneBuilder.addBox(-27.2, 21.4 + (i % 3) * 0.45, bz, 1.9, 0.7, 1.3, stdColor, {
          chip: 0.12, rotZ: (hash3(i, 22, 9) - .5) * .065
        });
      }

      // B. CENTRAL CLOISTER: battered triforium, nave and broken apse.
      const backPiers = [-17, -8.5, 0, 8.5, 17];
      for (const px of backPiers) {
        buildClusteredPier(stoneBuilder, px, -0.6, -19.6, 18.4, 1.18, 0, Math.abs(px) === 0);
      }
      for (let i = 0; i < backPiers.length - 1; i++) {
        buildPointedArchSpan(stoneBuilder, backPiers[i], -19.6, backPiers[i+1], -19.6,
          15.7, 5.25, 23.8, 1.8, {
            pierWidth: 2.05, brokenCrown: i===0 || i===3, segments: 12, moss: .29
          });
      }
      // Layered ribs of a destroyed vaulted ceiling.
      for (let x = -13.2; x <= 13.2; x += 4.4) {
        const zz = -19.6;
        for (let s = 0; s < 11; s++) {
          const t = s / 10;
          const y = 25 + Math.sin(t * Math.PI) * 4.4;
          if (s >= 8 && hash3(x,s,1) > .43) continue;
          stoneBuilder.addBox(x, y, zz + t * 6.2, .65, .75, 1.1, stdColor, {
            rotX: .45 * Math.cos(t * Math.PI), chip:.065
          });
        }
      }
      // Fallen masonry on the central rotunda. Keep main statue sightline open.
      for (let i=0; i<74; i++) {
        const a=rand()*Math.PI*2, r=8.7+rand()*15.5;
        const x=Math.cos(a)*r, z=Math.sin(a)*r - 4;
        if (z > 16 && Math.abs(x) < 4.5) continue;
        const k=.5+rand()*1.65;
        stoneBuilder.addBox(x, -0.05+rand()*.5, z, k*1.3, .55+rand()*.9, k*.82,
          causewayColor, { rotY:rand()*Math.PI, rotZ:(rand()-.5)*.3, chip:.11 });
        if (rand() < .2) foliageInstances.push({ x,y:.45,z,scale:.9,type:'moss' });
      }
      // Cross-aisles and sanctuary steps provide architectural depth from every camera.
      for (let side of [-1,1]) {
        const xx=side*23.5;
        const aisle=[-19,-8,3,14,25];
        for (let i=0;i<aisle.length;i++) {
          buildClusteredPier(stoneBuilder,xx,-.8,aisle[i],11.5,1.16,0,i===1);
          if (i<aisle.length-1) buildPointedArchSpan(stoneBuilder,xx,aisle[i],xx,aisle[i+1],9.9,4.25,16.2,1.72,{
            pierWidth:2.1,brokenCrown:i===2,segments:10,balustrade:i===0,moss:.22
          });
        }
      }
      // Giant southern arcade, punched through with pointed lancets.
      for (const zz of [-15.5,-3.5,8.5]) {
        buildClusteredPier(stoneBuilder, 31.5, -.85, zz, 18.7, 1.35, 0, zz===8.5);
      }
      buildPointedArchSpan(stoneBuilder,31.5,-15.5,31.5,-3.5,16.1,5.25,23.8,2.1,{segments:12,moss:.24});
      buildPointedArchSpan(stoneBuilder,31.5,-3.5,31.5,8.5,16.1,5.25,23.8,2.1,{segments:12,brokenCrown:true,moss:.28});

      // 3 bell towers, staggered in depth to make an unmistakable gothic skyline.
      buildRuinedBellTower(stoneBuilder, woodBuilder,-19.2,-17.2,-.4,39.0,9.0, .08,0);
      buildRuinedBellTower(stoneBuilder, woodBuilder, 20.2,-19.3,-.4,34.8,8.4,-.11,1);
      buildRuinedBellTower(stoneBuilder, woodBuilder, 31.4, 12.6,-.4,27.8,7.6,.10,2);

      // Flying buttresses connecting nave to side galleries, with visible broken ribs.
      for (let i=0;i<3;i++) {
        const z=-12.7+i*12.2;
        for (const sign of [-1,1]) {
          const x0=sign*19.2, x1=sign*30.2;
          buildPointedArchSpan(stoneBuilder,x0,z,x1,z,15.5,5.0,23.0,1.0,{
            openSpandrel:true,brokenCrown:i===2,segments:9,moss:.21
          });
          stoneBuilder.addBox(sign*27,10.5,z,1.4,21,1.7,stdColor,{chip:.07,skipBottom:true});
        }
      }

      // Broken cliff escarpments and an earthy substrate below flooded court.
      for (let ix=-36;ix<=37;ix+=2.4) {
        for (let iz=-32;iz<=43;iz+=2.4) {
          const ex=ix/37, ez=(iz-4)/37;
          const ellipse=ex*ex+ez*ez*1.24;
          if (ellipse>1.05 || (iz>23 && Math.abs(ix)<4.4)) continue;
          const no=fbm3(ix*.09,2,iz*.09,3);
          const topY=-1.25+no*.85;
          const depth=2.5+(1-ellipse)*5.5+no*2.0;
          cliffBuilder.addBox(ix,topY-depth*.5,iz,2.34,depth,2.34,cliffColor,{
            chip:.13,aoBottom:.45,skipBottom:true
          });
          if (hash3(ix,iz,32)>.85 && ellipse>.5 && ellipse<.96)
            foliageInstances.push({x:ix,y:topY+.28,z:iz,scale:.9+rand()*.5,type:'ivy'});
        }
      }
      for (let z=40;z<61;z+=2.3) {
        for (const x of [-3.2,3.2]) {
          cliffBuilder.addBox(x,-1.6,z,2.3,3.0,2.25,cliffColor,{chip:.08});
        }
      }
      // Moss on elevated stone edges, ruined arch crowns, and rubble patches.
      for (let i=0;i<360;i++) {
        const a=rand()*Math.PI*2, r=6+rand()*29;
        const x=Math.cos(a)*r,z=Math.sin(a)*r;
        if (z>17&&Math.abs(x)<3)continue;
        const y=hash3(i,3,8)>.85? 8+rand()*11 : -.12+rand()*.38;
        foliageInstances.push({x,y,z,scale:.2+rand()*.78,type:rand()<.35?'ivy':'moss'});
      }
      return {
        stone:stoneBuilder.toBufferGeometry(),
        wood:woodBuilder.toBufferGeometry(),
        cliffs:cliffBuilder.toBufferGeometry()
      };
    }
