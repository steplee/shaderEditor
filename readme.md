# ShaderEditor

An environment like ShaderToy, but offline and with any text editor of your choice.

You add directories to src, and at least provide a main.glsl. You can also provide several bufferA.glsl, bufferB.glsl, etc.
Which will get there own ping-pongable fbos and textures.

Visit 'localhost:9966/proj/first' for example for the file 'src/first/main.glsl'.
The source .glsl files are pushed when modified.

Next I want to add support for multiple color attachments to make state easier to use in shaders (which
shadertoy does not have, but is available with webgl2)
