// Source for java-runtime/public/codeshare-runner.jar. Rebuild: node scripts/build-java-bridge.mjs
// Runs inside the browser's virtual filesystem; no student code is sent to an external server.
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;

public final class CodeShareJava {
    private static native void running();
    private static final class OutputLimit extends RuntimeException {}
    private static native String readInput();
    private static native void output(String text);
    private static final class LiveInput extends InputStream {
        byte[] bytes;
        int position;
        LiveInput(String initial) { bytes = initial.getBytes(StandardCharsets.UTF_8); }
        public int read() {
            if (position == bytes.length) {
                String line = readInput();
                if (line == null) return -1;
                bytes = line.getBytes(StandardCharsets.UTF_8); position = 0;
                if (bytes.length == 0) return -1;
            }
            return bytes[position++] & 255;
        }
        // Return the available line without asking for more bytes: Scanner buffers its reads.
        public int read(byte[] target, int offset, int length) {
            if (length == 0) return 0;
            int first = read();
            if (first < 0) return -1;
            target[offset] = (byte)first;
            int count = Math.min(length - 1, bytes.length - position);
            System.arraycopy(bytes, position, target, offset + 1, count); position += count;
            return count + 1;
        }
    }
    private static final class Budget {
        int used;
        boolean live;
        Capture stdout, stderr;
        void publish() { if (live) output(stdout.text() + stderr.text()); }
    }
    private static final class Capture extends OutputStream {
        final Budget budget;
        Capture(Budget budget) { this.budget = budget; }
        final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        public void write(int value) {
            if (budget.used >= 65536) throw new OutputLimit();
            budget.used++; bytes.write(value);
        }
        public void flush() { budget.publish(); }
        String text() { return new String(bytes.toByteArray(), StandardCharsets.UTF_8); }
    }
    private static String json(boolean success, String output) {
        StringBuilder value = new StringBuilder("{\"success\":" + success + ",\"output\":\"");
        for (char c : output.toCharArray()) {
            if (c == '"' || c == '\\') value.append('\\').append(c);
            else if (c == '\n') value.append("\\n");
            else if (c == '\r') value.append("\\r");
            else if (c == '\t') value.append("\\t");
            else if (c < 32) value.append(String.format("\\u%04x", (int)c));
            else value.append(c);
        }
        return value.append("\"}").toString();
    }
    private static void remove(File file) {
        File[] children = file.listFiles();
        if (children != null) for (File child : children) remove(child);
        file.delete();
    }
    public static String run(String sourcePaths, String mainClass, String input, String directory) {
        return run(sourcePaths, mainClass, input, directory, false);
    }
    private static String run(String sourcePaths, String mainClass, String input, String directory, boolean interactive) {
        InputStream previousIn = System.in;
        PrintStream previousOut = System.out, previousErr = System.err;
        Budget budget = new Budget();
        Capture output = new Capture(budget), errors = new Capture(budget);
        budget.stdout = output; budget.stderr = errors;
        boolean success = false;
        try {
            Files.createDirectories(Paths.get(directory));
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            if (compiler == null) compiler = (JavaCompiler)Class.forName("com.sun.tools.javac.api.JavacTool").getDeclaredConstructor().newInstance();
            List<String> args = new ArrayList<>(Arrays.asList("-encoding", "UTF-8", "-d", directory, "-classpath", directory));
            args.addAll(Arrays.asList(sourcePaths.split("\n")));
            int compiled = compiler.run(null, output, errors, args.toArray(new String[0]));
            if (compiled != 0) return json(false, output.text() + errors.text());
            output.bytes.reset(); errors.bytes.reset(); budget.used = 0;
            budget.live = interactive && "true".equals(System.getProperty("codeshare.browser"));
            System.setIn(budget.live ? new LiveInput(input) : new ByteArrayInputStream(input.getBytes(StandardCharsets.UTF_8)));
            System.setOut(new PrintStream(output, true, "UTF-8"));
            System.setErr(new PrintStream(errors, true, "UTF-8"));
            if ("true".equals(System.getProperty("codeshare.browser"))) running();
            try (URLClassLoader loader = new URLClassLoader(new URL[]{new File(directory).toURI().toURL()}, CodeShareJava.class.getClassLoader())) {
                Class<?> entry = Class.forName(mainClass, true, loader);
                entry.getMethod("main", String[].class).invoke(null, (Object)new String[0]);
            }
            success = errors.bytes.size() == 0;
        } catch (Throwable error) {
            Throwable cause = error instanceof InvocationTargetException ? ((InvocationTargetException)error).getCause() : error;
            try { cause.printStackTrace(new PrintStream(errors, true, "UTF-8")); }
            catch (Throwable limit) { return json(false, output.text() + errors.text() + "\nExecution stopped: output exceeded 64 KB."); }
        } finally {
            System.setIn(previousIn); System.setOut(previousOut); System.setErr(previousErr);
            remove(new File(directory));
        }
        return json(success, output.text() + errors.text());
    }
    // /str is flat in CheerpJ. Copy strings into real source folders before compiling,
    // preserving filenames even when two packages both contain a class named Helper.
    public static String runSources(String paths, String mainClass, String input, String directory, String strings) {
        return runSources(paths, mainClass, input, directory, strings, false);
    }
    public static String runInteractiveSources(String paths, String mainClass, String input, String directory, String strings) {
        return runSources(paths, mainClass, input, directory, strings, true);
    }
    private static String runSources(String paths, String mainClass, String input, String directory, String strings, boolean interactive) {
        try {
            // /files persists in CheerpJ. A timed-out frame cannot run finally, so
            // clear abandoned runs before any new student class can execute.
            File current = new File(directory);
            File[] abandoned = current.getParentFile().listFiles();
            if (abandoned != null) for (File old : abandoned) {
                if (old.isDirectory() && old.getName().startsWith("run-") && !old.equals(current)) remove(old);
            }
            List<String> sources = new ArrayList<>();
            String[] names = paths.split("\\n");
            for (int index = 0; index < names.length; index++) {
                if (!names[index].matches("(?:[A-Za-z_$][\\w$]*/)*[A-Za-z_$][\\w$]*\\.java")) throw new IllegalArgumentException("Invalid Java path");
                java.nio.file.Path target = Paths.get(directory, "sources", names[index]);
                Files.createDirectories(target.getParent());
                Files.write(target, Files.readAllBytes(Paths.get(strings, "codeshare-" + index)));
                sources.add(target.toString());
            }
            return run(String.join("\n", sources), mainClass, input, directory, interactive);
        } catch (Throwable error) { return json(false, "Could not prepare Java sources: " + error); }
        finally { remove(new File(directory)); }
    }
    // Allows the same bridge to be exercised on a real JDK without browser mocks.
    public static void main(String[] args) { System.out.print(args.length == 5 ? runSources(args[0], args[1], args[2], args[3], args[4]) : run(args[0], args[1], args[2], args[3])); }
}
