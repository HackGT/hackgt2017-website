import Renderer from "./renderer.js";
import Timer from "./timer.js";
import GlitchPass from "../lib/postprocessing/GlitchPass.js";
import * as KenneyFuture from "../assets/fonts/kenney_future.json";

import THREE from "three";
import jump from "jump.js";

function wait(milliseconds) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, milliseconds);
    });
}

async function writeText(container) {
    await wait(500);

    const introText = [
        "Initializing......",
        "Well, here we are.",
        "Welcome to HackGT: New Heights"
    ];
    for (let line of introText) {
        container.textContent = "";
        for (let char of line) {
            container.textContent += char;
            let waitTime = Math.random() * 20 + 100;
            if ([",", ".", "!", "?", "\n"].indexOf(char) !== -1) {
                waitTime *= 3;
            }
            await wait(waitTime);
        }
        container.classList.add("idle");
        await wait(1000);
        container.classList.remove("idle");
    }
    container.classList.add("idle");
    await wait(500);
}

window.onload = async () => {
    "use strict";

    const engine = new Renderer({
        camera: {
            fov: 30,
            near: 0.1,
            far: 1500
        },
        antialias: true
        // debug: true
    });
    engine.camera.position.set(0, 0, 1200);
    engine.camera.lookAt(new THREE.Vector3(0, 0, 0));
    engine.render();

    const text = new Timer({
        date: "2017/10/13",
        font: KenneyFuture,
        size: 40,
        height: 10,
        curveSegments: 4,
        speed: 4,
        color: {
            font: 0xffffff,
            font_side: 0xaaaaaa
        },
        cursor: {
            text: "_"
        },
        after: () => {
            // Add glitch effect
            console.log("Animation Finished");
        }
    });

    // Position and rotate to face us.
    // text.mesh.position.x = middle;
    text.mesh.position.y = 0;
    text.mesh.position.z = 100;
    text.mesh.rotation.x = -0.3;
    text.mesh.rotation.y = Math.PI * 2;

	const texture = new THREE.Texture();
	texture.image = document.querySelector('.star-sky');
	texture.format = THREE.RGBFormat;
	texture.needsUpdate = true;

    const backgroundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 1000, 0),
        new THREE.MeshBasicMaterial({
            map: texture
        }));

    backgroundMesh.position.x = 0;
    backgroundMesh.position.y = -50;
    backgroundMesh.position.z = -200;
    backgroundMesh.rotation.x = 0;
    backgroundMesh.rotation.y = Math.PI * 2;

    engine.add({
        mesh: backgroundMesh,
        update: () => {}
    });

    engine.add(text);

    const glitchPass = new GlitchPass();
    glitchPass.renderToScreen = true;
    engine.composer.addPass(glitchPass);


    const isElementInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.bottom <= (window.innerHeight
                            || document.documentElement.clientHeight)
            // We do not check this since sometimes it gets cut on mobile
            // rect.left >= 0 &&
            // && rect.right <= (window.innerWidth
            //                || document.documentElement.clientWidth)
        );
    };

    const hexes = document.getElementsByClassName("hex-commands")[0];
    let hexes_animated_in = false;

    document.querySelector("p.skip-intro").addEventListener('click', (e) => {
        document.getElementsByClassName("cover")[0].classList.add("hidden");
    });

    let text_rendering = {};
    let selected_line = undefined;

    const draw_line = (line) => {
        document.querySelector(`.hex-commands > svg.${line}`).classList.add("draw");
        if (document.querySelector("input.prompt").value != line) {
            document.querySelector("input.prompt").value = "";
        }
        text_rendering[line] = setTimeout(() => {
            document.querySelector("input.prompt").value = line;
            display_section(line);
        }, 400);
    };

    const clear_line = (line) => {
        document.querySelector(`.hex-commands > svg.${line}`).classList.remove("draw");
        clearTimeout(text_rendering[line]);
        if (selected_line) {
            display_section(selected_line);
            document.querySelector("input.prompt").value = selected_line;
        }
    };

    const show_box = (selector) => {
        document.querySelector(`div.event-info > div.content > div.${selector}`)
            .classList.add("visible");
    };

    const hide_box = (selector) => {
        document.querySelector(`div.event-info > div.content > div.${selector}`)
            .classList.remove("visible");
    };

    const valid_content = new Set(['about', 'register', 'sponsor', 'atl', 'share']);
    const display_section = (selector) => {
        valid_content.forEach(hide_box);
        selector = selector.toLowerCase();
        if (valid_content.has(selector)) {
            show_box(selector);
        }
    };

    const select_line = (line) => {
        if (selected_line) {
            document.querySelector(`.hex-commands > svg.${selected_line}`)
                .classList.remove("selected");
            document.querySelector(`.hex-commands > img.${selected_line}-on`)
                .classList.remove("selected");
            document.querySelector(`.hex-commands > img.${selected_line}`)
                .classList.remove("selected");
        }

        if (line != selected_line) {
            selected_line = line;

            document.querySelector(`.hex-commands > svg.${line}`)
                .classList.add("selected");
            document.querySelector(`.hex-commands > img.${line}-on`)
                .classList.add("selected");
            document.querySelector(`.hex-commands > img.${line}`)
                .classList.add("selected");

            clearTimeout(text_rendering[line]);
            text_rendering[line] = setTimeout(() => {
                document.querySelector("input.prompt").value = line;
                display_section(line);
            }, 400);
        } else {
            selected_line = undefined;
        }
    };

    const on_scroll = async () => {
        if (!hexes_animated_in && isElementInViewport(hexes)) {
            const loading_text = document.querySelector(".hex-commands > p");

            const tiles = document.querySelectorAll(
                ".hex-commands > img.register, " +
                    ".hex-commands > img.about, " +
                    ".hex-commands > img.sponsor, " +
                    ".hex-commands > img.atl, " +
                    ".hex-commands > img.share"
            );
            hexes_animated_in = true;

            await wait(500);

            loading_text.classList.add("fadeout");

            await wait(500);

            for (const tile of tiles) {
                tile.classList.add("animate");
            }

            await wait(1000);

            select_line('about');
        }
    };
    document.addEventListener('scroll', on_scroll, false);
    document.addEventListener('touchmove', on_scroll, false);
    await on_scroll();

    document.querySelector("input.prompt").addEventListener('input', (e) => {
        display_section(e.target.value);
    });

    for (const line of ['about', 'register', 'sponsor', 'atl', 'share']) {
        document.querySelector(`.hex-commands > img.${line}-on`)
            .addEventListener('mouseenter', (e) => {
                draw_line(line);
        });

        document.querySelector(`.hex-commands > img.${line}-on`)
            .addEventListener('mouseleave', (e) => {
                clear_line(line);
        });

        document.querySelector(`.hex-commands > img.${line}-on`)
            .addEventListener('click', (e) => {
                select_line(line);
            });
    }

    await writeText(document.getElementById("intro-text"));
    document.getElementsByClassName("cover")[0].classList.add("hidden");
};